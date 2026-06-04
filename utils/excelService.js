// ============================================================
// excelService.js - Hybrid Database (Excel / MongoDB) Service
// Handles transparent data operations for local Excel & MongoDB Atlas
// ============================================================

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

// Path to excel-data folder
const DATA_DIR = (process.env.NETLIFY || process.env.LAMBDA_TASK_ROOT)
  ? '/tmp/excel-data'
  : path.join(__dirname, '..', 'excel-data');

// Make sure excel-data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Define headers for each Excel sheet / collection
const SHEET_HEADERS = {
  users: ['id', 'name', 'email', 'phone', 'password', 'createdAt'],
  bookings: ['id', 'userId', 'userName', 'userEmail', 'destination', 'date', 'guests', 'name', 'email', 'phone', 'message', 'status', 'createdAt'],
  reviews: ['id', 'userEmail', 'userName', 'destination', 'rating', 'comment', 'status', 'createdAt'],
  contacts: ['id', 'name', 'email', 'subject', 'message', 'createdAt'],
  newsletter: ['id', 'email', 'createdAt'],
  settings: ['key', 'value', 'createdAt'],
  team: ['id', 'name', 'role', 'image', 'createdAt'],
  pois: ['id', 'name', 'category', 'lat', 'lng', 'description', 'address', 'rating', 'image', 'createdAt']
};

const MONGODB_URI = process.env.MONGODB_URI;
let mongoClient = null;
let db = null;
const isMongo = !!MONGODB_URI;

// Helper to get local excel file path
function getFilePath(sheetName) {
  return path.join(DATA_DIR, `${sheetName}.xlsx`);
}

// Initialize an excel file with headers if it doesn't exist
async function initSheet(sheetName, customWorkbook) {
  const filePath = getFilePath(sheetName);
  if (!fs.existsSync(filePath) || customWorkbook) {
    const workbook = customWorkbook || new ExcelJS.Workbook();
    let sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      sheet = workbook.addWorksheet(sheetName);
    }
    const headers = SHEET_HEADERS[sheetName];
    sheet.spliceRows(1, sheet.rowCount); // Clear sheet rows if rewriting
    sheet.addRow(headers);
    // Style the header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1d3557' }
    };
    if (!customWorkbook) {
      await workbook.xlsx.writeFile(filePath);
    }
  }
}

// Sync MongoDB collection to Excel file in the background (for Admin Panel downloads)
async function syncToExcel(sheetName) {
  if (!isMongo) return;
  try {
    const filePath = getFilePath(sheetName);
    const workbook = new ExcelJS.Workbook();
    await initSheet(sheetName, workbook);
    const sheet = workbook.getWorksheet(sheetName);
    const headers = SHEET_HEADERS[sheetName];
    
    const collection = db.collection(sheetName);
    const docs = await collection.find({}).toArray();
    
    docs.forEach(doc => {
      const rowData = headers.map(h => doc[h] || '');
      sheet.addRow(rowData);
    });
    
    await workbook.xlsx.writeFile(filePath);
  } catch (err) {
    console.error(`[Sync Error] Failed to sync ${sheetName} to Excel:`, err);
  }
}

// Initialize database / sheets
async function initAllSheets() {
  if (isMongo) {
    console.log('🔌 Connecting to MongoDB Atlas...');
    try {
      mongoClient = new MongoClient(MONGODB_URI);
      await mongoClient.connect();
      db = mongoClient.db();
      console.log(`✅ Connected successfully to MongoDB database: "${db.databaseName}"`);

      // Seed settings if empty
      const phone = await findOne('settings', 'key', 'contact_phone');
      if (!phone) {
        await addRow('settings', { key: 'contact_phone', value: '+91 98765 43210', createdAt: new Date().toLocaleString() });
      }
      const email = await findOne('settings', 'key', 'contact_email');
      if (!email) {
        await addRow('settings', { key: 'contact_email', value: 'xyz7@gmail.com', createdAt: new Date().toLocaleString() });
      }

      // Start background sync of all collections to local Excel files for download support
      for (const sheetName of Object.keys(SHEET_HEADERS)) {
        syncToExcel(sheetName);
      }
    } catch (err) {
      console.error('❌ Failed to connect to MongoDB:', err);
      throw err;
    }
  } else {
    // Fallback Excel initialization
    for (const sheetName of Object.keys(SHEET_HEADERS)) {
      await initSheet(sheetName);
    }

    const phone = await findOne('settings', 'key', 'contact_phone');
    if (!phone) {
      await addRow('settings', { key: 'contact_phone', value: '+91 98765 43210', createdAt: new Date().toLocaleString() });
    }
    const email = await findOne('settings', 'key', 'contact_email');
    if (!email) {
      await addRow('settings', { key: 'contact_email', value: 'xyz7@gmail.com', createdAt: new Date().toLocaleString() });
    }
    console.log('✅ Excel sheets initialized successfully (Local Mode)');
  }

  // Seed default POIs if empty
  try {
    const pois = await readData('pois');
    if (!pois || pois.length === 0) {
      const defaultPois = [
        {
          id: 'poi-1',
          name: 'Basaveshwar Temple, Vidyagiri',
          category: 'temple',
          lat: '16.1812',
          lng: '75.6983',
          description: 'A serene and sacred temple dedicated to Lord Basaveshwara, situated in Vidyagiri, Bagalkote.',
          address: 'Vidyagiri, Bagalkote, Karnataka',
          rating: '4.8',
          image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-2',
          name: 'Badami Cave Temples',
          category: 'tourist',
          lat: '15.9189',
          lng: '75.6791',
          description: 'Magnificent rock-cut temples carved out of sandstone hills, dating back to the Chalukya dynasty in the 6th century.',
          address: 'Badami, Bagalkote District, Karnataka',
          rating: '4.9',
          image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-3',
          name: 'Pattadakal Temple Complex',
          category: 'temple',
          lat: '15.9491',
          lng: '75.8197',
          description: 'A UNESCO World Heritage Site featuring a harmonious blend of North and South Indian temple architectures.',
          address: 'Pattadakal, Bagalkote District, Karnataka',
          rating: '4.8',
          image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-4',
          name: 'Aihole Durga Temple',
          category: 'tourist',
          lat: '16.0211',
          lng: '75.8828',
          description: 'Famous as the "Cradle of Indian Temple Architecture", Aihole features a unique Durga temple.',
          address: 'Aihole, Bagalkote District, Karnataka',
          rating: '4.7',
          image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-5',
          name: 'Vidyagiri Food Junction',
          category: 'restaurant',
          lat: '16.1834',
          lng: '75.6961',
          description: 'A popular local dining spot offering authentic North Karnataka meals, jolada rotti, and continental options.',
          address: 'Main Road, Vidyagiri, Bagalkote, Karnataka',
          rating: '4.5',
          image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-6',
          name: 'Almatti Dam & Rock Gardens',
          category: 'tourist',
          lat: '16.3323',
          lng: '75.8890',
          description: 'A major hydroelectric project on the Krishna River, featuring beautifully landscaped gardens and musical fountains.',
          address: 'Almatti, Bagalkote District, Karnataka',
          rating: '4.6',
          image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-7',
          name: 'Taj Mahal, Agra',
          category: 'tourist',
          lat: '27.1751',
          lng: '78.0421',
          description: 'One of the Seven Wonders of the World — a magnificent ivory-white marble mausoleum on the south bank of Yamuna river.',
          address: 'Agra, Uttar Pradesh',
          rating: '4.9',
          image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-8',
          name: 'Grand Kaveri Veg Restaurant',
          category: 'restaurant',
          lat: '16.1805',
          lng: '75.6970',
          description: 'Excellent multi-cuisine family restaurant specializing in South Indian breakfast and authentic North Karnataka thalis.',
          address: 'Sector 10, Vidyagiri, Bagalkote, Karnataka',
          rating: '4.6',
          image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-9',
          name: 'Spice Garden Bar & Restaurant',
          category: 'restaurant',
          lat: '16.1840',
          lng: '75.6990',
          description: 'A popular family eatery serving spicy Mughlai, Chinese, and Tandoori chicken starters in Vidyagiri.',
          address: 'Club Road, Vidyagiri, Bagalkote, Karnataka',
          rating: '4.3',
          image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-10',
          name: 'Kalyan Heritage Hotel & Lodge',
          category: 'lodge',
          lat: '16.1825',
          lng: '75.6945',
          description: 'Comfortable premium rooms, standard lodges, and guest suites with modern amenities, room service, and ample parking.',
          address: 'Vidyagiri Main Road, Bagalkote, Karnataka',
          rating: '4.5',
          image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-11',
          name: 'Hotel BG Palace & Lodge',
          category: 'lodge',
          lat: '16.1850',
          lng: '75.7020',
          description: 'Budget-friendly AC and Non-AC lodging accommodation ideal for families and travelers visiting Bagalkote.',
          address: 'Near Navanagar Gate, Vidyagiri, Bagalkote, Karnataka',
          rating: '4.2',
          image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-12',
          name: 'Heritage Lodge & Resort Badami',
          category: 'lodge',
          lat: '15.9120',
          lng: '75.6830',
          description: 'Relaxing resort style cottages and traditional suites, located within 1 km of the historic Badami cave temples.',
          address: 'Station Road, Badami, Karnataka',
          rating: '4.7',
          image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-13',
          name: 'Gokak Waterfalls',
          category: 'falls',
          lat: '16.1894',
          lng: '74.8317',
          description: 'A beautiful waterfall resembling Niagara Falls, formed by the Ghataprabha River dropping 52 meters over sandstone cliffs.',
          address: 'Gokak, Belagavi District, Karnataka',
          rating: '4.8',
          image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600',
          createdAt: new Date().toLocaleString()
        },
        {
          id: 'poi-14',
          name: 'Sogal Someshwar Waterfalls',
          category: 'falls',
          lat: '15.7833',
          lng: '75.0500',
          description: 'A scenic hill side waterfall cascading near the ancient Someshwar Temple, ideal for weekend nature trips.',
          address: 'Sogal, Belagavi District, Karnataka',
          rating: '4.5',
          image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600',
          createdAt: new Date().toLocaleString()
        }
      ];
      for (const p of defaultPois) {
        await addRow('pois', p);
      }
      console.log('✅ Seeded default points of interest (POIs) successfully.');
    }
  } catch (err) {
    console.error('Failed to seed default POIs:', err);
  }
}

// Read all rows (returns array of objects)
async function readData(sheetName) {
  if (isMongo) {
    try {
      const collection = db.collection(sheetName);
      const docs = await collection.find({}).toArray();
      return docs.map(doc => {
        const obj = { ...doc };
        delete obj._id; // Remove MongoDB internal ID for application consistency
        return obj;
      });
    } catch (err) {
      console.error(`[DB Error] Failed to read from collection ${sheetName}:`, err);
      return [];
    }
  } else {
    await initSheet(sheetName);
    const filePath = getFilePath(sheetName);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(sheetName);
    
    const rows = [];
    const headers = SHEET_HEADERS[sheetName];
    
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row.getCell(i + 1).value || '';
      });
      rows.push(obj);
    });
    
    return rows;
  }
}

// Add a new row / document
async function addRow(sheetName, data) {
  if (isMongo) {
    try {
      const collection = db.collection(sheetName);
      await collection.insertOne({ ...data });
      // Sync to local Excel in background for backup/download
      syncToExcel(sheetName);
    } catch (err) {
      console.error(`[DB Error] Failed to insert into collection ${sheetName}:`, err);
      throw err;
    }
  } else {
    await initSheet(sheetName);
    const filePath = getFilePath(sheetName);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(sheetName);
    
    const headers = SHEET_HEADERS[sheetName];
    const rowData = headers.map(h => data[h] || '');
    sheet.addRow(rowData);
    
    await workbook.xlsx.writeFile(filePath);
  }
}

// Delete a row / document by ID
async function deleteRow(sheetName, id) {
  if (isMongo) {
    try {
      const collection = db.collection(sheetName);
      const query = (sheetName === 'settings') ? { key: id } : { id: id };
      const result = await collection.deleteOne(query);
      syncToExcel(sheetName);
      return result.deletedCount > 0;
    } catch (err) {
      console.error(`[DB Error] Failed to delete from collection ${sheetName}:`, err);
      return false;
    }
  } else {
    await initSheet(sheetName);
    const filePath = getFilePath(sheetName);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(sheetName);
    
    let rowIndexToDelete = -1;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === String(id)) {
        rowIndexToDelete = rowNumber;
      }
    });
    
    if (rowIndexToDelete > 0) {
      sheet.spliceRows(rowIndexToDelete, 1);
      await workbook.xlsx.writeFile(filePath);
      return true;
    }
    return false;
  }
}

// Update a row / document by ID
async function updateRow(sheetName, id, newData) {
  if (isMongo) {
    try {
      const collection = db.collection(sheetName);
      const query = (sheetName === 'settings') ? { key: id } : { id: id };
      await collection.updateOne(query, { $set: newData });
      syncToExcel(sheetName);
    } catch (err) {
      console.error(`[DB Error] Failed to update collection ${sheetName}:`, err);
      throw err;
    }
  } else {
    await initSheet(sheetName);
    const filePath = getFilePath(sheetName);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(sheetName);
    const headers = SHEET_HEADERS[sheetName];
    
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === String(id)) {
        headers.forEach((header, i) => {
          if (newData[header] !== undefined) {
            row.getCell(i + 1).value = newData[header];
          }
        });
      }
    });
    
    await workbook.xlsx.writeFile(filePath);
  }
}

// Find a single row / document by a field value
async function findOne(sheetName, field, value) {
  if (isMongo) {
    try {
      const collection = db.collection(sheetName);
      // Escape special regex characters in search term for safety
      const escapedValue = String(value).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Case-insensitive exact match
      const query = { [field]: { $regex: new RegExp(`^${escapedValue}$`, 'i') } };
      const doc = await collection.findOne(query);
      if (doc) {
        const obj = { ...doc };
        delete obj._id;
        return obj;
      }
      return null;
    } catch (err) {
      console.error(`[DB Error] Failed to find in collection ${sheetName}:`, err);
      return null;
    }
  } else {
    const rows = await readData(sheetName);
    return rows.find(row => String(row[field]).toLowerCase() === String(value).toLowerCase()) || null;
  }
}

// Generate Excel workbook in-memory and write to stream
async function writeExcelToStream(sheetName, stream) {
  const headers = SHEET_HEADERS[sheetName];
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  
  sheet.addRow(headers);
  // Style the header row
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1d3557' }
  };
  
  const data = await readData(sheetName);
  data.forEach(row => {
    const rowData = headers.map(h => row[h] !== undefined ? String(row[h]) : '');
    sheet.addRow(rowData);
  });
  
  await workbook.xlsx.write(stream);
}

module.exports = {
  initAllSheets,
  readData,
  addRow,
  deleteRow,
  updateRow,
  findOne,
  getFilePath,
  writeExcelToStream
};
