/**
 * Utility functions for exporting data from the application
 */

/**
 * Convert telemetry data to CSV format
 * @param {Array} data - Array of telemetry data objects
 * @param {String} type - Type of telemetry data (fish or plant)
 * @returns {String} CSV formatted string
 */
export const convertToCSV = (data, type) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Define headers based on data type
  let headers = [];
  if (type === 'fish') {
    headers = ['timestamp', 'phLevel', 'temperatureLevel', 'tdsLevel', 'turbidityLevel', 'ecLevel'];
  } else if (type === 'plant') {
    headers = ['timestamp', 'humidityLevel', 'temperatureLevel', 'pressureLevel'];
  } else {
    // Generic approach - use first object keys
    headers = Object.keys(data[0]);
  }

  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers.map(header => {
      // Format timestamp if it exists
      if (header === 'timestamp' && item[header]) {
        const date = new Date(item[header]);
        return date.toISOString();
      }
      
      // Handle null or undefined values
      if (item[header] === null || item[header] === undefined) {
        return '';
      }
      
      // Handle numbers with decimal places
      if (typeof item[header] === 'number') {
        return item[header].toString();
      }
      
      // Handle strings that might contain commas
      if (typeof item[header] === 'string' && item[header].includes(',')) {
        return `"${item[header]}"`;
      }
      
      return item[header];
    }).join(',');
  }).join('\n');

  return `${headerRow}\n${rows}`;
};

/**
 * Download data as a CSV file
 * @param {String} csvContent - CSV formatted string
 * @param {String} fileName - Name of the file to download
 */
export const downloadCSV = (csvContent, fileName) => {
  if (!csvContent) {
    console.warn('No data to download');
    return;
  }
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
