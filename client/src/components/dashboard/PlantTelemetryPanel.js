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

const PlantTelemetryPanel = ({ data, historyData = [], timeGranularity = '10m', isLoading = false }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const lineColor = useColorModeValue('spotify.green', 'green.400');
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const [chartTypes, setChartTypes] = React.useState({
    pressureLevel: 'line',
    temperatureLevel: 'line',
    humidityLevel: 'bar'
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
        return parameter === 'humidityLevel' ? 'bar' : 'line'; // Mix of charts for daily data
      case 'week':
        return parameter === 'pressureLevel' ? 'bar' : 'line'; // Bar charts for weekly aggregates
      case 'month':
        return parameter === 'temperatureLevel' ? 'line' : 'bar'; // Bar charts for monthly aggregates
      default:
        return 'line';
    }
  };

  // Update chart types when time granularity changes
  React.useEffect(() => {
    setChartTypes({
      pressureLevel: getDefaultChartType('pressureLevel'),
      temperatureLevel: getDefaultChartType('temperatureLevel'),
      humidityLevel: getDefaultChartType('humidityLevel')
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
      'pressureLevel': ['pressure', 'pressureLevel', 'airPressure'],
      'temperatureLevel': ['plantTemperature', 'temperature', 'airTemperature'],
      'humidityLevel': ['humidity', 'airHumidity', 'relativeHumidity']
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
          Plant Tray Telemetry
        </Heading>
        
        {isLoading ? (
          <Text>Loading telemetry data...</Text>
        ) : !data ? (
          <Text>No telemetry data available</Text>
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              <StatCard 
                title="Pressure" 
                value={(data.pressure || data.pressureLevel)?.toFixed(2)} 
                unit="kPa" 
                iconType="pressure" 
                isWarning={(data.pressure || data.pressureLevel) < 0.5 || (data.pressure || data.pressureLevel) > 5.0}
                bgColor={bgColor}
              />
              <StatCard 
                title="Temperature" 
                value={(data.plantTemperature || data.temperatureLevel)?.toFixed(1)} 
                unit="°C" 
                iconType="temperature" 
                isWarning={(data.plantTemperature || data.temperatureLevel) < 18 || (data.plantTemperature || data.temperatureLevel) > 28}
                bgColor={bgColor}
              />
              <StatCard 
                title="Humidity" 
                value={(data.humidity || data.humidityLevel)?.toFixed(1)} 
                unit="%" 
                iconType="humidity" 
                isWarning={(data.humidity || data.humidityLevel) < 50 || (data.humidity || data.humidityLevel) > 85}
                bgColor={bgColor}
              />
            </SimpleGrid>
            
            {historyData && historyData.length > 0 && (
              <>  
                <Flex justify="space-between" align="center" mt={4} mb={2}>
                  <Heading as="h3" size="md" color={textColor}>
                    Telemetry Trends
                  </Heading>
                  <Tooltip label="Export plant telemetry data as CSV">
                    <Button
                      size="sm"
                      leftIcon={<DownloadIcon />}
                      colorScheme="green"
                      variant="outline"
                      onClick={() => {
                        if (historyData && historyData.length > 0) {
                          const csvContent = convertToCSV(historyData, 'plant');
                          downloadCSV(csvContent, `plant-telemetry-${new Date().toISOString().split('T')[0]}.csv`);
                        }
                      }}
                      isDisabled={!historyData || historyData.length === 0}
                    >
                      Export Data
                    </Button>
                  </Tooltip>
                </Flex>
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mt={4}>
                  <Box h="250px" p={4} bg={bgColor} borderRadius="md" boxShadow="sm">
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading as="h4" size="md" color={textColor}>
                        Humidity Trend
                      </Heading>
                      <Select 
                        size="sm" 
                        width="120px" 
                        value={chartTypes.humidityLevel}
                        onChange={(e) => setChartTypes({...chartTypes, humidityLevel: e.target.value})}
                      >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="doughnut">Doughnut</option>
                      </Select>
                    </Flex>
                    <Box h="200px">
                      {formatChartData('humidityLevel') && (
                        <>
                          {chartTypes.humidityLevel === 'line' && <Line data={formatChartData('humidityLevel')} options={getChartOptions('humidityLevel')} />}
                          {chartTypes.humidityLevel === 'bar' && <Bar data={formatChartData('humidityLevel')} options={getChartOptions('humidityLevel')} />}
                          {chartTypes.humidityLevel === 'pie' && <Pie data={formatChartData('humidityLevel')} options={getChartOptions('humidityLevel')} />}
                          {chartTypes.humidityLevel === 'doughnut' && <Doughnut data={formatChartData('humidityLevel')} options={getChartOptions('humidityLevel')} />}
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
                  <Box h="250px" p={4} bg={bgColor} borderRadius="md" boxShadow="sm">
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading as="h4" size="md" color={textColor}>
                        Pressure Trend
                      </Heading>
                      <Select 
                        size="sm" 
                        width="120px" 
                        value={chartTypes.pressureLevel}
                        onChange={(e) => setChartTypes({...chartTypes, pressureLevel: e.target.value})}
                      >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="doughnut">Doughnut</option>
                      </Select>
                    </Flex>
                    <Box h="200px">
                      {formatChartData('pressureLevel') && (
                        <>
                          {chartTypes.pressureLevel === 'line' && <Line data={formatChartData('pressureLevel')} options={getChartOptions('pressureLevel')} />}
                          {chartTypes.pressureLevel === 'bar' && <Bar data={formatChartData('pressureLevel')} options={getChartOptions('pressureLevel')} />}
                          {chartTypes.pressureLevel === 'pie' && <Pie data={formatChartData('pressureLevel')} options={getChartOptions('pressureLevel')} />}
                          {chartTypes.pressureLevel === 'doughnut' && <Doughnut data={formatChartData('pressureLevel')} options={getChartOptions('pressureLevel')} />}
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

export default PlantTelemetryPanel;
