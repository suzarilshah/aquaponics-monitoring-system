import React from 'react';
import { 
  Box, 
  SimpleGrid, 
  Heading, 
  VStack, 
  Text, 
  useColorModeValue,
  Select,
  Flex,
  Button,
  Tooltip
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { convertToCSV, downloadCSV } from '../../utils/exportUtils';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import StatCard from './StatCard';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const FishTelemetryPanel = ({ data, historyData = [], timeGranularity = '10m', isLoading = false }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const lineColor = useColorModeValue('spotify.green', 'green.400');
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const [chartTypes, setChartTypes] = React.useState({
    phLevel: 'line',
    temperatureLevel: 'line',
    tdsLevel: 'bar',
    turbidityLevel: 'line',
    ecLevel: 'line'
  });

  // Get appropriate chart type based on time granularity
  const getDefaultChartType = (parameter) => {
    // Normalize timeGranularity to handle both 'week' and other values
    const normalizedGranularity = timeGranularity || 'day';
    
    switch(normalizedGranularity) {
      case '10min':
        return 'line'; // Line chart for detailed short-term data
      case 'hour':
        return 'line'; // Line chart for hourly data
      case 'day':
        return parameter === 'tdsLevel' ? 'bar' : 'line'; // Mix of charts for daily data
      case 'week':
        return parameter === 'phLevel' ? 'bar' : 'line'; // Bar charts for weekly aggregates
      case 'month':
        return parameter === 'temperatureLevel' ? 'line' : 'bar'; // Bar charts for monthly aggregates
      default:
        return 'line';
    }
  };

  // Update chart types when time granularity changes
  React.useEffect(() => {
    setChartTypes({
      phLevel: getDefaultChartType('phLevel'),
      temperatureLevel: getDefaultChartType('temperatureLevel'),
      tdsLevel: getDefaultChartType('tdsLevel'),
      turbidityLevel: getDefaultChartType('turbidityLevel'),
      ecLevel: getDefaultChartType('ecLevel')
    });
  }, [timeGranularity]);

  // Format historical data for charts
  const formatChartData = (parameter) => {
    if (!historyData || historyData.length === 0) {
      console.warn(`No history data available for parameter: ${parameter}`);
      return null;
    }

    // Map UI field names to potential API field names
    const fieldMapping = {
      'phLevel': ['waterPH', 'pH', 'ph'],
      'temperatureLevel': ['waterTemperature', 'temperature'],
      'tdsLevel': ['tds', 'TDS', 'tdsLevel'],
      'turbidityLevel': ['turbidity', 'turbidityLevel'],
      'ecLevel': ['ecValues', 'ec', 'EC']
    };

    // Function to find valid value across multiple possible field names
    const getValidValue = (entry, possibleFields) => {
      if (!possibleFields) return entry[parameter];
      
      // Try each possible field name
      for (const field of possibleFields) {
        if (entry[field] !== undefined && entry[field] !== null) {
          return entry[field];
        }
      }
      
      // If none of the mapped fields exist, try the original parameter
      return entry[parameter];
    };
    
    console.log(`Formatting chart data for ${parameter} with ${historyData.length} records`);
    console.log(`Time granularity: ${timeGranularity}`);

    // Sample entry for debugging
    if (historyData[0]) {
      console.log('Sample data entry:', historyData[0]);
      console.log('Available fields:', Object.keys(historyData[0]));
    }

    // Format time labels based on granularity
    const labels = historyData.map(entry => {
      if (!entry || !entry.timestamp) {
        console.warn('Entry missing timestamp:', entry);
        return 'Unknown';
      }
      
      const date = new Date(entry.timestamp);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', entry.timestamp);
        return 'Invalid';
      }
      
      // Normalize timeGranularity to handle both 'week' and other values
      const normalizedGranularity = timeGranularity || 'day';
      
      switch(normalizedGranularity) {
        case '10min':
          return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        case 'hour':
          // For hourly view, show 5-minute intervals
          return `${date.getHours()}:${Math.floor(date.getMinutes() / 5) * 5}`.padEnd(5, '0');
        case 'day':
          // For daily view, show hours
          return `${date.getHours()}:00`;
        case 'week':
          // For weekly view, show day of week
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        case 'month':
          // For monthly view, show day of month
          return `${date.getDate()}`;
        case '6m':
          // For 6-month view, show month name
          return date.toLocaleDateString('en-US', { month: 'short' });
        default:
          console.log(`Using default time format for granularity: ${normalizedGranularity}`);
          return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
    });

    // Get values using all possible field names
    const values = historyData.map(entry => {
      if (!entry) return 0;
      
      const possibleFields = fieldMapping[parameter];
      const value = getValidValue(entry, possibleFields);
      
      if (value === undefined || value === null) {
        console.warn(`Missing value for ${parameter} in entry:`, entry);
        // Look at all available fields for debugging
        if (entry) {
          console.log('Available fields in this entry:', Object.keys(entry).join(', '));
        }
        return 0;
      }
      
      return Number(value);
    });
    
    console.log(`Generated ${values.length} data points for ${parameter}`);
    if (values.length > 0) {
      console.log('Value samples:', values.slice(0, 3));
    }

    // Generate colors for pie/doughnut charts
    const generateColors = (count) => {
      const colors = [];
      const baseColors = [
        'rgba(43, 183, 97, 0.7)',  // Green
        'rgba(54, 162, 235, 0.7)', // Blue
        'rgba(255, 206, 86, 0.7)', // Yellow
        'rgba(75, 192, 192, 0.7)', // Teal
        'rgba(153, 102, 255, 0.7)' // Purple
      ];
      
      for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
      }
      
      return colors;
    };

    // Different dataset configuration based on chart type
    if (chartTypes[parameter] === 'pie' || chartTypes[parameter] === 'doughnut') {
      return {
        labels,
        datasets: [
          {
            label: parameter.replace('Level', ''),
            data: values,
            backgroundColor: generateColors(values.length),
            borderColor: generateColors(values.length).map(color => color.replace('0.7', '1')),
            borderWidth: 1,
          },
        ],
      };
    }
    
    return {
      labels,
      datasets: [
        {
          label: parameter.replace('Level', ''),
          data: values,
          borderColor: chartTypes[parameter] === 'bar' ? generateColors(values.length) : lineColor,
          backgroundColor: chartTypes[parameter] === 'bar' 
            ? generateColors(values.length)
            : 'rgba(43, 183, 97, 0.1)',
          borderWidth: chartTypes[parameter] === 'bar' ? 1 : 2,
          tension: 0.4,
          fill: chartTypes[parameter] === 'line',
          pointRadius: values.length > 20 ? 1 : 3,
          pointBackgroundColor: 'rgba(43, 183, 97, 1)',
        },
      ],
    };
  };

  // Chart options based on chart type
  const getChartOptions = (parameter) => {
    // Base options for all chart types
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
    };

    // For pie and doughnut charts
    if (chartTypes[parameter] === 'pie' || chartTypes[parameter] === 'doughnut') {
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: textColor,
              font: {
                size: 10
              }
            }
          },
        },
      };
    }

    // For line and bar charts
    return {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            color: gridColor,
            borderColor: gridColor,
          },
          ticks: {
            color: subTextColor,
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          grid: {
            color: gridColor,
            borderColor: gridColor,
          },
          ticks: {
            color: subTextColor,
          },
        },
      },
    };
  };

  // Default chart options for backward compatibility
  const chartOptions = {
  };

  return (
    <Box p={4} bg={bgColor} borderRadius="lg" boxShadow="sm">
      <VStack spacing={6} align="stretch">
        <Heading as="h2" size="lg" color={textColor}>
          Fish Tank Telemetry
        </Heading>
        
        {isLoading ? (
          <Text>Loading telemetry data...</Text>
        ) : !data ? (
          <Text>No telemetry data available</Text>
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              <StatCard 
                title="pH Level" 
                value={data.phLevel?.toFixed(2)} 
                unit="pH" 
                iconType="ph" 
                isWarning={data.phLevel < 6.5 || data.phLevel > 8.5}
                bgColor={bgColor}
              />
              <StatCard 
                title="Temperature" 
                value={data.temperatureLevel?.toFixed(1)} 
                unit="°C" 
                iconType="temperature" 
                isWarning={data.temperatureLevel < 20 || data.temperatureLevel > 30}
                bgColor={bgColor}
              />
              <StatCard 
                title="TDS Level" 
                value={data.tdsLevel?.toFixed(0)} 
                unit="ppm" 
                iconType="tds" 
                isWarning={data.tdsLevel < 100 || data.tdsLevel > 500}
                bgColor={bgColor}
              />
              <StatCard 
                title="Turbidity" 
                value={data.turbidityLevel?.toFixed(1)} 
                unit="NTU" 
                iconType="turbidity" 
                isWarning={data.turbidityLevel < 0 || data.turbidityLevel > 25}
                bgColor={bgColor}
              />
              <StatCard 
                title="EC Level" 
                value={data.ecLevel?.toFixed(2)} 
                unit="mS/cm" 
                iconType="ec" 
                isWarning={data.ecLevel < 0.5 || data.ecLevel > 3.0}
                bgColor={bgColor}
              />
            </SimpleGrid>
            
            {historyData && historyData.length > 0 && (
              <>
                <Flex justify="space-between" align="center" mt={4} mb={2}>
                  <Heading as="h3" size="md" color={textColor}>
                    Telemetry Trends
                  </Heading>
                  <Tooltip label="Export fish telemetry data as CSV">
                    <Button
                      size="sm"
                      leftIcon={<DownloadIcon />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => {
                        if (historyData && historyData.length > 0) {
                          const csvContent = convertToCSV(historyData, 'fish');
                          downloadCSV(csvContent, `fish-telemetry-${new Date().toISOString().split('T')[0]}.csv`);
                        }
                      }}
                      isDisabled={!historyData || historyData.length === 0}
                    >
                      Export Data
                    </Button>
                  </Tooltip>
                </Flex>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <Box h="250px" p={4} bg={bgColor} borderRadius="md" boxShadow="sm">
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading as="h4" size="md" color={textColor}>
                        pH Level Trend
                      </Heading>
                      <Select 
                        size="sm" 
                        width="120px" 
                        value={chartTypes.phLevel}
                        onChange={(e) => setChartTypes({...chartTypes, phLevel: e.target.value})}
                      >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="doughnut">Doughnut</option>
                      </Select>
                    </Flex>
                    <Box h="200px">
                      {formatChartData('phLevel') && (
                        <>
                          {chartTypes.phLevel === 'line' && <Line data={formatChartData('phLevel')} options={getChartOptions('phLevel')} />}
                          {chartTypes.phLevel === 'bar' && <Bar data={formatChartData('phLevel')} options={getChartOptions('phLevel')} />}
                          {chartTypes.phLevel === 'pie' && <Pie data={formatChartData('phLevel')} options={getChartOptions('phLevel')} />}
                          {chartTypes.phLevel === 'doughnut' && <Doughnut data={formatChartData('phLevel')} options={getChartOptions('phLevel')} />}
                        </>
                      )}
                    </Box>
                  </Box>
                  <Box h="250px" p={4} bg={bgColor} borderRadius="md" boxShadow="sm">
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading as="h4" size="md" color={textColor}>
                        Temperature Trend
                      </Heading>
                      <Select 
                        size="sm" 
                        width="120px" 
                        value={chartTypes.temperatureLevel}
                        onChange={(e) => setChartTypes({...chartTypes, temperatureLevel: e.target.value})}
                      >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="doughnut">Doughnut</option>
                      </Select>
                    </Flex>
                    <Box h="200px">
                      {formatChartData('temperatureLevel') && (
                        <>
                          {chartTypes.temperatureLevel === 'line' && <Line data={formatChartData('temperatureLevel')} options={getChartOptions('temperatureLevel')} />}
                          {chartTypes.temperatureLevel === 'bar' && <Bar data={formatChartData('temperatureLevel')} options={getChartOptions('temperatureLevel')} />}
                          {chartTypes.temperatureLevel === 'pie' && <Pie data={formatChartData('temperatureLevel')} options={getChartOptions('temperatureLevel')} />}
                          {chartTypes.temperatureLevel === 'doughnut' && <Doughnut data={formatChartData('temperatureLevel')} options={getChartOptions('temperatureLevel')} />}
                        </>
                      )}
                    </Box>
                  </Box>
                </SimpleGrid>
                
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mt={4}>
                  <Box h="250px" p={4} bg={bgColor} borderRadius="md" boxShadow="sm">
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading as="h4" size="md" color={textColor}>
                        TDS Level Trend
                      </Heading>
                      <Select 
                        size="sm" 
                        width="120px" 
                        value={chartTypes.tdsLevel}
                        onChange={(e) => setChartTypes({...chartTypes, tdsLevel: e.target.value})}
                      >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="doughnut">Doughnut</option>
                      </Select>
                    </Flex>
                    <Box h="200px">
                      {formatChartData('tdsLevel') && (
                        <>
                          {chartTypes.tdsLevel === 'line' && <Line data={formatChartData('tdsLevel')} options={getChartOptions('tdsLevel')} />}
                          {chartTypes.tdsLevel === 'bar' && <Bar data={formatChartData('tdsLevel')} options={getChartOptions('tdsLevel')} />}
                          {chartTypes.tdsLevel === 'pie' && <Pie data={formatChartData('tdsLevel')} options={getChartOptions('tdsLevel')} />}
                          {chartTypes.tdsLevel === 'doughnut' && <Doughnut data={formatChartData('tdsLevel')} options={getChartOptions('tdsLevel')} />}
                        </>
                      )}
                    </Box>
                  </Box>
                  <Box h="250px" p={4} bg={bgColor} borderRadius="md" boxShadow="sm">
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading as="h4" size="md" color={textColor}>
                        Turbidity Trend
                      </Heading>
                      <Select 
                        size="sm" 
                        width="120px" 
                        value={chartTypes.turbidityLevel}
                        onChange={(e) => setChartTypes({...chartTypes, turbidityLevel: e.target.value})}
                      >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="doughnut">Doughnut</option>
                      </Select>
                    </Flex>
                    <Box h="200px">
                      {formatChartData('turbidityLevel') && (
                        <>
                          {chartTypes.turbidityLevel === 'line' && <Line data={formatChartData('turbidityLevel')} options={getChartOptions('turbidityLevel')} />}
                          {chartTypes.turbidityLevel === 'bar' && <Bar data={formatChartData('turbidityLevel')} options={getChartOptions('turbidityLevel')} />}
                          {chartTypes.turbidityLevel === 'pie' && <Pie data={formatChartData('turbidityLevel')} options={getChartOptions('turbidityLevel')} />}
                          {chartTypes.turbidityLevel === 'doughnut' && <Doughnut data={formatChartData('turbidityLevel')} options={getChartOptions('turbidityLevel')} />}
                        </>
                      )}
                    </Box>
                  </Box>
                  <Box h="250px" p={4} bg={bgColor} borderRadius="md" boxShadow="sm">
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading as="h4" size="md" color={textColor}>
                        EC Level Trend
                      </Heading>
                      <Select 
                        size="sm" 
                        width="120px" 
                        value={chartTypes.ecLevel}
                        onChange={(e) => setChartTypes({...chartTypes, ecLevel: e.target.value})}
                      >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="doughnut">Doughnut</option>
                      </Select>
                    </Flex>
                    <Box h="200px">
                      {formatChartData('ecLevel') && (
                        <>
                          {chartTypes.ecLevel === 'line' && <Line data={formatChartData('ecLevel')} options={getChartOptions('ecLevel')} />}
                          {chartTypes.ecLevel === 'bar' && <Bar data={formatChartData('ecLevel')} options={getChartOptions('ecLevel')} />}
                          {chartTypes.ecLevel === 'pie' && <Pie data={formatChartData('ecLevel')} options={getChartOptions('ecLevel')} />}
                          {chartTypes.ecLevel === 'doughnut' && <Doughnut data={formatChartData('ecLevel')} options={getChartOptions('ecLevel')} />}
                        </>
                      )}
                    </Box>
                  </Box>
                </SimpleGrid>
              </>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
};

export default FishTelemetryPanel;
