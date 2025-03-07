import axios from 'axios';
import Papa from 'papaparse';

// Create a custom axios instance without default headers
const apiClient = axios.create({
  timeout: 8000, // 8 second timeout
  headers: {}
});

// Remove any default headers that might be causing issues
delete apiClient.defaults.headers.common['Authorization'];

class TelemetryDataService {
  constructor() {
    this.fishInitialData = [];
    this.fishValidateData = [];
    this.plantInitialData = [];
    this.plantValidateData = [];
    this.isDataLoaded = false;
    this.currentIndex = 0;
  }

  async loadAllData() {
    // If data is already loaded, just return
    if (this.isDataLoaded) {
      console.log('Data already loaded, using cached data');
      return;
    }
    
    try {
      console.log('Loading all telemetry data...');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:6789/api';
      console.log('Using API URL:', apiUrl);
      
      // Initialize data arrays to prevent null reference errors
      this.fishInitialData = [];
      this.fishValidateData = [];
      this.plantInitialData = [];
      this.plantValidateData = [];
      
      try {
        // Make the API requests with individual error handling for each request
        console.log('Fetching fish initial data...');
        try {
          // Create axios config without Authorization header in development mode
          const axiosConfig = {
            timeout: 5000, // 5 second timeout
            headers: {}
          };
          
          const fishInitialResponse = await apiClient.get(`${apiUrl}/telemetry/fish/data?dataset=initial`, axiosConfig);
          console.log('Processing fish initial data...');
          this.fishInitialData = fishInitialResponse.data || [];
          console.log('Fish initial data loaded:', this.fishInitialData.length, 'records');
        } catch (fishInitialError) {
          console.error('Error fetching fish initial data:', fishInitialError);
          // Continue with other requests
        }
        
        console.log('Fetching fish validate data...');
        try {
          const axiosConfig = {
            timeout: 5000,
            headers: {}
          };
          
          const fishValidateResponse = await apiClient.get(`${apiUrl}/telemetry/fish/data?dataset=validate`, axiosConfig);
          console.log('Processing fish validate data...');
          this.fishValidateData = fishValidateResponse.data || [];
          console.log('Fish validate data loaded:', this.fishValidateData.length, 'records');
        } catch (fishValidateError) {
          console.error('Error fetching fish validate data:', fishValidateError);
          // Continue with other requests
        }
        
        console.log('Fetching plant initial data...');
        try {
          const axiosConfig = {
            timeout: 5000,
            headers: {}
          };
          
          const plantInitialResponse = await apiClient.get(`${apiUrl}/telemetry/plant/data?dataset=initial`, axiosConfig);
          console.log('Processing plant initial data...');
          this.plantInitialData = plantInitialResponse.data || [];
          console.log('Plant initial data loaded:', this.plantInitialData.length, 'records');
        } catch (plantInitialError) {
          console.error('Error fetching plant initial data:', plantInitialError);
          // Continue with other requests
        }
        
        console.log('Fetching plant validate data...');
        try {
          const axiosConfig = {
            timeout: 5000,
            headers: {}
          };
          
          const plantValidateResponse = await apiClient.get(`${apiUrl}/telemetry/plant/data?dataset=validate`, axiosConfig);
          console.log('Processing plant validate data...');
          this.plantValidateData = plantValidateResponse.data || [];
          console.log('Plant validate data loaded:', this.plantValidateData.length, 'records');
        } catch (plantValidateError) {
          console.error('Error fetching plant validate data:', plantValidateError);
          // Continue with other requests
        }
        
        // Check if we got any data at all
        const totalRecords = 
          this.fishInitialData.length + 
          this.fishValidateData.length + 
          this.plantInitialData.length + 
          this.plantValidateData.length;
          
        if (totalRecords === 0) {
          throw new Error('No telemetry data could be loaded from any endpoint');
        }
        
        // Sort all data by timestamp
        console.log('Sorting data by timestamp...');
        if (Array.isArray(this.fishInitialData) && this.fishInitialData.length > 0) {
          this.fishInitialData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        if (Array.isArray(this.fishValidateData) && this.fishValidateData.length > 0) {
          this.fishValidateData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        if (Array.isArray(this.plantInitialData) && this.plantInitialData.length > 0) {
          this.plantInitialData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        if (Array.isArray(this.plantValidateData) && this.plantValidateData.length > 0) {
          this.plantValidateData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        
        this.isDataLoaded = true;
        console.log('All telemetry data loaded successfully');
        console.log('Fish initial data:', this.fishInitialData.length, 'records');
        console.log('Fish validate data:', this.fishValidateData.length, 'records');
        console.log('Plant initial data:', this.plantInitialData.length, 'records');
        console.log('Plant validate data:', this.plantValidateData.length, 'records');
      } catch (error) {
        console.error('Error fetching data from API:', error);
        // We've already initialized empty arrays above
        // Mark as loaded with whatever data we were able to get
        this.isDataLoaded = true;
        throw new Error(`Failed to load complete telemetry data: ${error.message}`);
      }
    } catch (error) {
      console.error('Error loading telemetry data:', error);
      throw error;
    }
  }

  // This method is no longer used as we're fetching directly from the API
  async fetchCSV(filePath) {
    try {
      const response = await axios.get(filePath);
      return response.data;
    } catch (error) {
      console.error(`Error fetching CSV file ${filePath}:`, error);
      throw error;
    }
  }

  parseCSV(csvData) {
    // If data is already an array (JSON from API), just normalize it
    if (Array.isArray(csvData)) {
      return csvData.map(item => this.normalizeData(item));
    }
    
    // Otherwise parse as CSV string
    const results = Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    // Normalize field names (remove spaces, parentheses)
    const normalizedData = results.data.map(item => {
      const normalized = {};
      Object.keys(item).forEach(key => {
        // Normalize the key by removing parentheses and converting to camelCase
        const normalizedKey = key
          .replace(/\([^)]*\)/g, '') // Remove parentheses and their contents
          .trim()
          .replace(/\s+(.)/g, (_, char) => char.toUpperCase()) // Convert to camelCase
          .replace(/\s/g, '') // Remove remaining spaces
          .replace(/^(.)/, (_, char) => char.toLowerCase()); // Ensure first character is lowercase
        
        normalized[normalizedKey] = item[key];
      });
      
      // Normalize timestamp field name
      if (normalized.timestamp) {
        // timestamp already exists, no need to reassign
      } else if (normalized.Timestamp) {
        normalized.timestamp = normalized.Timestamp;
        delete normalized.Timestamp;
      }
      
      // Add systemId if not present
      if (!normalized.systemId) {
        normalized.systemId = 'system-001';
      }
      
      return normalized;
    });
    
    return normalizedData;
  }

  // Legacy method - renamed to avoid duplication
  getFilteredDataByType(dataType, startDate, endDate, granularity = 'hour') {
    if (!this.isDataLoaded) {
      throw new Error('Data not loaded yet. Call loadAllData() first.');
    }
    
    let dataset;
    if (dataType === 'fish-initial') dataset = this.fishInitialData;
    else if (dataType === 'fish-validate') dataset = this.fishValidateData;
    else if (dataType === 'plant-initial') dataset = this.plantInitialData;
    else if (dataType === 'plant-validate') dataset = this.plantValidateData;
    else throw new Error('Invalid data type');
    
    // Use the new getFilteredData method
    return this.getFilteredData(dataset, startDate, endDate, granularity);
  }

  // Group data by specified time granularity
  groupDataByGranularity(data, granularity) {
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
    
    return groups;
  }

  // Aggregate grouped data (average values for each group)
  aggregateGroupedData(groupedData) {
    const result = [];
    
    Object.entries(groupedData).forEach(([key, items]) => {
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

  // Group data by time intervals (e.g., hourly, daily, weekly, monthly)
  groupDataByTimeInterval(data, interval) {
    console.log('Grouping data by interval:', interval);
    if (!data || data.length === 0) return {};
    
    const groups = {};
    
    // Special handling for time-based grouping
    const useCustomGrouping = ['hour', 'day', 'week', 'month', '6m'].includes(interval);
    
    if (useCustomGrouping) {
      // Group by the specified time period
      data.forEach(item => {
        if (!item || !item.timestamp) return;
        
        const date = new Date(item.timestamp);
        if (isNaN(date.getTime())) return;
        
        let key;
        
        switch (interval) {
          case 'hour':
            // Group by 5-minute intervals within an hour
            key = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${Math.floor(date.getMinutes() / 5) * 5}`;
            break;
          case 'day':
            // Group by hour
            key = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:00`;
            break;
          case 'week':
            // Group by day of week
            key = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            break;
          case 'month':
            // Group by day of month
            key = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            break;
          case '6m':
            // Group by month
            key = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}`;
            break;
          default:
            key = date.toISOString();
        }
        
        if (!groups[key]) {
          groups[key] = [];
        }
        
        groups[key].push(item);
      });
      
      console.log(`Grouped data into ${Object.keys(groups).length} ${interval} intervals`);
      return groups;
    }
    
    // Original millisecond-based grouping for other intervals
    let intervalMs;
    
    // Map Dashboard time filter values to appropriate intervals
    switch (interval) {
      // Original values
      case '1min':
        intervalMs = 60 * 1000;
        break;
      case '5min':
        intervalMs = 5 * 60 * 1000;
        break;
      case '10min':
        intervalMs = 10 * 60 * 1000;
        break;
      case '30min':
        intervalMs = 30 * 60 * 1000;
        break;
      case 'hourly':
        intervalMs = 60 * 60 * 1000;
        break;
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      default:
        console.log('Using default interval for:', interval);
        intervalMs = 10 * 60 * 1000; // Default to 10 minutes
    }
    
    // Group data points by time interval
    data.forEach(item => {
      if (!item || !item.timestamp) return;
      
      const timestamp = new Date(item.timestamp).getTime();
      if (isNaN(timestamp)) return;
      
      const intervalKey = Math.floor(timestamp / intervalMs) * intervalMs;
      
      if (!groups[intervalKey]) {
        groups[intervalKey] = [];
      }
      
      groups[intervalKey].push(item);
    });
    
    console.log('Grouped data into', Object.keys(groups).length, 'intervals');
    return groups;
  }
  
  // Aggregate grouped data by time interval (calculate averages for each group)
  aggregateTimeIntervalData(groupedData) {
    console.log('Aggregating grouped time interval data');
    const result = [];
    
    // Process each group
    Object.values(groupedData).forEach(items => {
      if (items.length === 0) return;
      
      const aggregated = {};
      
      // Get all numeric fields from the first item
      const firstItem = items[0];
      const numericKeys = Object.keys(firstItem).filter(key => {
        return typeof firstItem[key] === 'number';
      });
      
      // Calculate average for each numeric field
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
  
  // Filter data locally based on time range and granularity
  getFilteredData(dataset, startDate, endDate, granularity) {
    console.log('Filtering data locally with range:', startDate, 'to', endDate);
    console.log('Dataset size:', dataset ? dataset.length : 0);
    
    if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
      console.warn('Dataset is empty or invalid');
      return [];
    }
    
    // Convert dates to timestamps for comparison
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();
    
    // Filter data by time range
    const filteredData = dataset.filter(item => {
      if (!item || !item.timestamp) return false;
      const itemDate = new Date(item.timestamp);
      const itemTimestamp = itemDate.getTime();
      return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
    });
    
    console.log('Filtered data size:', filteredData.length);
    
    // Group and aggregate if needed
    if (granularity !== 'raw') {
      const groupedData = this.groupDataByTimeInterval(filteredData, granularity);
      return this.aggregateTimeIntervalData(groupedData);
    }
    
    return filteredData;
  }

  // Get real-time data for cycling through the dataset
  async getCurrentTelemetry(systemId = 'system-001') {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:6789/api';
      console.log('Fetching current telemetry from API:', apiUrl);
      
      // Create axios config without Authorization header
      const axiosConfig = {
        params: { systemId },
        timeout: 5000,
        headers: {}
      };
      
      const response = await apiClient.get(`${apiUrl}/telemetry/current`, axiosConfig);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to get current telemetry');
      }
    } catch (error) {
      console.error('Error getting current telemetry:', error);
      
      // Return meaningful demo data if API fails
      // Check if we already have loaded initial data and use it
      if (this.fishInitialData?.length && this.plantInitialData?.length) {
        console.log('Falling back to locally cached demo data');
        const randomFishIndex = Math.floor(Math.random() * this.fishInitialData.length);
        const randomPlantIndex = Math.floor(Math.random() * this.plantInitialData.length);
        
        return {
          fish: this.fishInitialData[randomFishIndex] || {},
          plant: this.plantInitialData[randomPlantIndex] || {}
        };
      }
      
      // If no initial data is loaded yet, return some dummy data with property names matching panel expectations
      return {
        fish: {
          timestamp: new Date().toISOString(),
          systemId: systemId,
          phLevel: 7.0 + Math.random() * 0.4,       // This matches FishTelemetryPanel expectations
          temperatureLevel: 24 + Math.random() * 2,  // This matches FishTelemetryPanel expectations
          tdsLevel: 350 + Math.random() * 50,        // This matches FishTelemetryPanel expectations
          turbidityLevel: 10 + Math.random() * 5,    // This matches FishTelemetryPanel expectations
          ecLevel: 1.5 + Math.random() * 0.5,        // This matches FishTelemetryPanel expectations
          dissolvedOxygen: 6.5 + Math.random() * 0.5,
          ammonia: 0.1 + Math.random() * 0.05,
          nitrate: 20 + Math.random() * 10
        },
        plant: {
          timestamp: new Date().toISOString(),
          systemId: systemId,
          moistureLevel: 65 + Math.random() * 10,      // This matches PlantTelemetryPanel expectations
          nutrientLevel: 80 + Math.random() * 5,       // This matches PlantTelemetryPanel expectations
          lightLevel: 70 + Math.random() * 15,         // This matches PlantTelemetryPanel expectations
          temperatureLevel: 22 + Math.random() * 3,    // This matches PlantTelemetryPanel expectations
          humidityLevel: 55 + Math.random() * 10       // This matches PlantTelemetryPanel expectations
        }
      };
    }
  }

  // Get fish telemetry data from API with time filtering
  async getFishTelemetry(startDate, endDate, isValidation = false, granularity = '10min') {
    try {
      console.log('Getting fish telemetry with date range:', startDate, 'to', endDate);
      
      // If we already have the data loaded, filter it locally
      if (this.isDataLoaded) {
        console.log('Using locally loaded fish data');
        const dataset = isValidation ? this.fishValidateData : this.fishInitialData;
        return this.getFilteredData(dataset, startDate, endDate, granularity);
      }
      
      // Otherwise, fetch from API
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:6789/api';
      console.log('Fetching fish telemetry from API:', apiUrl);
      
      // Create axios config without Authorization header
      const axiosConfig = {
        params: {
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          isValidation: isValidation.toString(),
          granularity
        },
        timeout: 5000,
        headers: {}
      };
      
      const response = await apiClient.get(`${apiUrl}/telemetry/fish`, axiosConfig);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching fish telemetry:', error);
      
      // Generate mock historical data instead of throwing an error
      console.log('Generating mock fish telemetry data for visualization');
      return this.generateMockFishTelemetryData(startDate, endDate, granularity);
    }
  }
  
  // Generate mock fish telemetry data for visualization when API fails
  generateMockFishTelemetryData(startDate, endDate, granularity) {
    const mockData = [];
    const interval = this.getIntervalFromGranularity(granularity);
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    let currentTime = startTime;
    
    while (currentTime <= endTime) {
      // Generate realistic but slightly varied data points using field names expected by FishTelemetryPanel
      mockData.push({
        timestamp: new Date(currentTime).toISOString(),
        systemId: 'system-001',
        // Use the field names that FishTelemetryPanel expects based on its fieldMapping
        waterPH: 7.0 + Math.sin(currentTime/86400000) * 0.4,  // mapped from phLevel
        waterTemperature: 24 + Math.sin(currentTime/86400000) * 2, // mapped from temperatureLevel
        tds: 350 + Math.sin(currentTime/86400000) * 50, // mapped from tdsLevel
        turbidity: 10 + Math.cos(currentTime/86400000) * 5, // mapped from turbidityLevel
        ecValues: 1.5 + Math.sin(currentTime/86400000) * 0.3, // mapped from ecLevel
        dissolvedOxygen: 6.5 + Math.cos(currentTime/86400000) * 0.5,
        ammonia: 0.1 + Math.abs(Math.sin(currentTime/86400000)) * 0.05,
        nitrate: 20 + Math.cos(currentTime/86400000) * 10,
        // Also include the UI field names for the StatCard components
        phLevel: 7.0 + Math.sin(currentTime/86400000) * 0.4,
        temperatureLevel: 24 + Math.sin(currentTime/86400000) * 2,
        tdsLevel: 350 + Math.sin(currentTime/86400000) * 50,
        turbidityLevel: 10 + Math.cos(currentTime/86400000) * 5,
        ecLevel: 1.5 + Math.sin(currentTime/86400000) * 0.3
      });
      
      // Add time based on granularity
      currentTime += interval;
    }
    
    return mockData;
  }

  // Helper method to convert granularity to millisecond interval
  getIntervalFromGranularity(granularity) {
    // Default interval values in milliseconds
    switch(granularity) {
      case '10min':
        return 10 * 60 * 1000; // 10 minutes
      case 'hour':
        return 60 * 60 * 1000; // 1 hour
      case 'day':
        return 6 * 60 * 60 * 1000; // 6 hours for daily view
      case 'week':
        return 24 * 60 * 60 * 1000; // 1 day for weekly view
      case 'month':
        return 3 * 24 * 60 * 60 * 1000; // 3 days for monthly view
      case '6m':
        return 7 * 24 * 60 * 60 * 1000; // 7 days for 6-month view
      default:
        return 60 * 60 * 1000; // Default to 1 hour
    }
  }

  // Get plant telemetry data from API with time filtering
  async getPlantTelemetry(startDate, endDate, isValidation = false, granularity = '10min') {
    try {
      console.log('Getting plant telemetry with date range:', startDate, 'to', endDate);
      
      // If we already have the data loaded, filter it locally
      if (this.isDataLoaded) {
        console.log('Using locally loaded plant data');
        const dataset = isValidation ? this.plantValidateData : this.plantInitialData;
        return this.getFilteredData(dataset, startDate, endDate, granularity);
      }
      
      // Otherwise, fetch from API
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:6789/api';
      console.log('Fetching plant telemetry from API:', apiUrl);
      
      // Create axios config without Authorization header
      const axiosConfig = {
        params: {
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          isValidation: isValidation.toString(),
          granularity
        },
        timeout: 5000,
        headers: {}
      };
      
      const response = await apiClient.get(`${apiUrl}/telemetry/plant`, axiosConfig);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching plant telemetry:', error);
      
      // Generate mock plant telemetry data instead of throwing an error
      console.log('Generating mock plant telemetry data for visualization');
      return this.generateMockPlantTelemetryData(startDate, endDate, granularity);
    }
  }
  
  // Generate mock plant telemetry data for visualization when API fails
  generateMockPlantTelemetryData(startDate, endDate, granularity) {
    const mockData = [];
    const interval = this.getIntervalFromGranularity(granularity);
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    let currentTime = startTime;
    
    while (currentTime <= endTime) {
      // Generate realistic but slightly varied data points with field names expected by PlantTelemetryPanel
      mockData.push({
        timestamp: new Date(currentTime).toISOString(),
        systemId: 'system-001',
        // UI field names for StatCard components
        moistureLevel: 65 + Math.sin(currentTime/86400000) * 10,
        nutrientLevel: 80 + Math.cos(currentTime/86400000) * 5,
        lightLevel: 70 + Math.sin(currentTime/43200000) * 15, // Varies twice daily
        temperatureLevel: 22 + Math.sin(currentTime/86400000) * 3,
        humidityLevel: 55 + Math.cos(currentTime/86400000) * 10,
        // Field names that PlantTelemetryPanel expects based on its fieldMapping
        pressure: 1013 + Math.sin(currentTime/86400000) * 5, // mapped from pressureLevel
        plantTemperature: 22 + Math.sin(currentTime/86400000) * 3, // mapped from temperatureLevel
        humidity: 55 + Math.cos(currentTime/86400000) * 10, // mapped from humidityLevel
        // Also include original names in case they're used elsewhere
        pressureLevel: 1013 + Math.sin(currentTime/86400000) * 5
      });
      
      // Add time based on granularity
      currentTime += interval;
    }
    
    return mockData;
  }
}

const telemetryDataService = new TelemetryDataService();
export default telemetryDataService;
