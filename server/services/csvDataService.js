const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class CSVDataService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data/');
    this.fishInitialData = [];
    this.fishValidateData = [];
    this.plantInitialData = [];
    this.plantValidateData = [];
    this.isDataLoaded = false;
    this.currentIndex = 0;
  }

  async loadAllData() {
    if (this.isDataLoaded) return;

    try {
      this.fishInitialData = await this.readCSVFile('fish_initial.csv');
      this.fishValidateData = await this.readCSVFile('fish_validate.csv');
      this.plantInitialData = await this.readCSVFile('plant_initial.csv');
      this.plantValidateData = await this.readCSVFile('plant_validate.csv');
      
      // Sort all data by timestamp
      this.fishInitialData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      this.fishValidateData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      this.plantInitialData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      this.plantValidateData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Find the index for March 7, 2024 in the initial datasets
      const targetDate = new Date('2024-03-07T00:00:00Z');
      this.currentIndex = this.fishInitialData.findIndex(item => 
        new Date(item.timestamp) >= targetDate
      );
      if (this.currentIndex === -1) this.currentIndex = 0;
      
      this.isDataLoaded = true;
      console.log('All CSV data loaded successfully');
    } catch (error) {
      console.error('Error loading CSV data:', error);
      throw error;
    }
  }

  readCSVFile(filename) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(path.join(this.dataPath, filename))
        .pipe(csv())
        .on('data', (data) => {
          // Normalize field names (remove spaces, parentheses)
          const normalizedData = {};
          Object.keys(data).forEach(key => {
            // Normalize the key by removing spaces, parentheses and converting to camelCase
            const normalizedKey = key
              .replace(/\([^)]*\)/g, '') // Remove parentheses and their contents
              .trim()
              .replace(/\s+(.)/g, (_, char) => char.toUpperCase()) // Convert to camelCase
              .replace(/\s/g, '') // Remove remaining spaces
              .replace(/^(.)/, (_, char) => char.toLowerCase()); // Ensure first character is lowercase
            
            // Convert numeric string values to numbers
            normalizedData[normalizedKey] = 
              !isNaN(data[key]) && data[key] !== '' ? parseFloat(data[key]) : data[key];
          });
          
          // Normalize timestamp field name
          if (normalizedData.timestamp) {
            normalizedData.timestamp = normalizedData.timestamp;
          } else if (normalizedData.Timestamp) {
            normalizedData.timestamp = normalizedData.Timestamp;
            delete normalizedData.Timestamp;
          }
          
          // Add systemId if not present
          if (!normalizedData.systemId) {
            normalizedData.systemId = 'system-001';
          }
          
          results.push(normalizedData);
        })
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  getFishData(isValidation = false, startTime = null, endTime = null, granularity = '10min') {
    const data = isValidation ? this.fishValidateData : this.fishInitialData;
    let filteredData = this.filterDataByTimeRange(data, startTime, endTime);
    
    if (granularity !== '10min') {
      filteredData = this.applyGranularity(filteredData, granularity);
    }
    
    return filteredData;
  }

  getPlantData(isValidation = false, startTime = null, endTime = null, granularity = '10min') {
    const data = isValidation ? this.plantValidateData : this.plantInitialData;
    let filteredData = this.filterDataByTimeRange(data, startTime, endTime);
    
    if (granularity !== '10min') {
      filteredData = this.applyGranularity(filteredData, granularity);
    }
    
    return filteredData;
  }

  filterDataByTimeRange(data, startTime, endTime) {
    if (!startTime && !endTime) return data;
    
    return data.filter(item => {
      const timestamp = new Date(item.timestamp);
      if (startTime && timestamp < new Date(startTime)) return false;
      if (endTime && timestamp > new Date(endTime)) return false;
      return true;
    });
  }

  applyGranularity(data, granularity) {
    // Group data by the specified granularity
    const groups = {};
    
    data.forEach(item => {
      const timestamp = new Date(item.timestamp);
      let key;
      
      switch (granularity) {
        case 'month':
          key = `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}`;
          break;
        case 'week':
          // Get ISO week number
          const d = new Date(timestamp);
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
          const week = Math.floor((d - new Date(d.getFullYear(), 0, 4)) / 604800000);
          key = `${timestamp.getFullYear()}-W${week}`;
          break;
        case 'day':
          key = timestamp.toISOString().split('T')[0];
          break;
        case 'hour':
          key = `${timestamp.toISOString().split('T')[0]}T${timestamp.getHours()}`;
          break;
        default:
          key = timestamp.toISOString();
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    
    // Aggregate data for each group (average values)
    const result = [];
    
    Object.entries(groups).forEach(([key, items]) => {
      const aggregated = { timestamp: key };
      const numericKeys = Object.keys(items[0]).filter(k => 
        k !== 'timestamp' && k !== 'systemId' && typeof items[0][k] === 'number'
      );
      
      numericKeys.forEach(field => {
        const values = items.map(item => item[field]).filter(v => v !== null && v !== undefined);
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          aggregated[field] = sum / values.length;
        }
      });
      
      // Use the timestamp of the middle item for this group
      const middleItem = items[Math.floor(items.length / 2)];
      aggregated.timestamp = middleItem.timestamp;
      aggregated.systemId = middleItem.systemId;
      
      result.push(aggregated);
    });
    
    return result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  getCurrentTelemetry() {
    if (!this.isDataLoaded || this.fishInitialData.length === 0) {
      throw new Error('Data not loaded yet or empty dataset');
    }
    
    // Get current data point
    const fishData = this.fishInitialData[this.currentIndex];
    
    // Find the closest plant data point by timestamp
    const fishTimestamp = new Date(fishData.timestamp);
    let closestPlantIndex = 0;
    let minTimeDiff = Infinity;
    
    this.plantInitialData.forEach((item, index) => {
      const plantTimestamp = new Date(item.timestamp);
      const timeDiff = Math.abs(plantTimestamp - fishTimestamp);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestPlantIndex = index;
      }
    });
    
    const plantData = this.plantInitialData[closestPlantIndex];
    
    // Increment index for next call
    this.currentIndex = (this.currentIndex + 1) % this.fishInitialData.length;
    
    return {
      fish: fishData,
      plant: plantData,
      timestamp: fishData.timestamp
    };
  }
}

module.exports = new CSVDataService();
