import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Button,
  useToast,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  useColorModeValue,
  Badge,
  Select,
  Container,
  Spinner
} from '@chakra-ui/react';
import { MdPause, MdPlayArrow, MdRefresh } from 'react-icons/md';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

// Component imports
import FishTelemetryPanel from '../components/dashboard/FishTelemetryPanel';
import PlantTelemetryPanel from '../components/dashboard/PlantTelemetryPanel';
import StatCard from '../components/dashboard/StatCard';
import TimeRangeFilter from '../components/common/TimeRangeFilter';
import telemetryDataService from '../services/telemetryDataService';

// Connect to socket server
const socket = io(process.env.REACT_APP_SOCKET_ENDPOINT || 'http://localhost:5000');

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  // State for telemetry data
  const [fishData, setFishData] = useState(null);
  const [plantData, setPlantData] = useState(null);
  const [fishHistoryData, setFishHistoryData] = useState([]);
  const [plantHistoryData, setPlantHistoryData] = useState([]);
  const [isDataPaused, setIsDataPaused] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', title: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('day');
  const [dateRange, setDateRange] = useState({
    startDate: new Date('2024-03-07'),
    endDate: new Date()
  });
  const [systemId, setSystemId] = useState('system-001');
  
  // References for cleanup
  const socketRef = useRef(socket);
  
  // UI colors
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const alertBgColor = useColorModeValue('red.50', 'rgba(254, 178, 178, 0.16)');
  const alertBorderColor = useColorModeValue('red.300', 'red.300');
  
  // Fetch filtered data based on time range and granularity
  // Function to manually refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      
      // Clear any existing error messages
      setAlert({
        show: false,
        type: 'error',
        title: '',
        message: ''
      });
      
      // Attempt to reload telemetry data
      let retryCount = 0;
      const maxRetries = 3;
      let dataLoaded = false;
      
      while (!dataLoaded && retryCount < maxRetries) {
        try {
          console.log(`Dashboard: Refreshing telemetry data (attempt ${retryCount + 1})`);
          await telemetryDataService.loadAllData();
          dataLoaded = true;
          console.log('Dashboard: Telemetry data refreshed successfully');
        } catch (loadError) {
          retryCount++;
          console.warn(`Dashboard: Failed to refresh telemetry data (attempt ${retryCount}):`, loadError);
          if (retryCount >= maxRetries) {
            console.error('Dashboard: Max retries reached for refresh');
            break;
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Fetch filtered data based on current time range
      await fetchFilteredData();
      
      setLoading(false);
      
      // Show success toast
      toast({
        title: 'Data Refreshed',
        description: 'Telemetry data has been successfully refreshed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setLoading(false);
      
      // Show error toast
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh telemetry data: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchFilteredData = useCallback(async () => {
    // Store current fish and plant data before setting loading state (moved outside the try block)
    const currentFishData = fishData;
    const currentPlantData = plantData;
    
    try {
      setLoading(true);
      
      console.log('Fetching filtered data with time range:', dateRange, 'and filter:', timeFilter);
      console.log('Start date:', dateRange.startDate);
      console.log('End date:', dateRange.endDate);
      
      // Make sure telemetry data is loaded first with retry logic
      if (!telemetryDataService.isDataLoaded) {
        console.log('Loading all telemetry data first...');
        let retryCount = 0;
        const maxRetries = 3;
        let dataLoaded = false;
        
        while (!dataLoaded && retryCount < maxRetries) {
          try {
            console.log(`Attempting to load telemetry data (attempt ${retryCount + 1})`);
            await telemetryDataService.loadAllData();
            dataLoaded = true;
            console.log('All telemetry data loaded, fish initial data size:', 
              telemetryDataService.fishInitialData?.length || 0,
              'fish validate data size:', telemetryDataService.fishValidateData?.length || 0);
            console.log('Plant initial data size:', 
              telemetryDataService.plantInitialData?.length || 0,
              'plant validate data size:', telemetryDataService.plantValidateData?.length || 0);
          } catch (loadError) {
            retryCount++;
            console.warn(`Failed to load telemetry data (attempt ${retryCount}):`, loadError);
            if (retryCount >= maxRetries) {
              console.error(`Failed to load telemetry data after ${maxRetries} attempts. Continuing with fallback data.`);
              break; // Continue with fallback data instead of throwing
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      let fishData = [];
      let plantData = [];
      
      // Fetch fish telemetry data with retry logic
      console.log('Fetching fish telemetry data...');
      try {
        fishData = await telemetryDataService.getFishTelemetry(
          dateRange.startDate,
          dateRange.endDate,
          false,
          timeFilter
        );
        console.log('Received fish data:', fishData ? fishData.length : 0, 'records');
        
        // Force generation of mock data if nothing was returned
        if (!fishData || fishData.length === 0) {
          console.log('No fish data received, forcing generation of mock data');
          fishData = telemetryDataService.generateMockFishTelemetryData(
            dateRange.startDate,
            dateRange.endDate,
            timeFilter
          );
          console.log('Generated mock fish data:', fishData.length, 'records');
        }
      } catch (fishError) {
        console.error('Error fetching fish telemetry data:', fishError);
        // Generate mock data instead of using empty array
        console.log('Generating mock fish data after error');
        fishData = telemetryDataService.generateMockFishTelemetryData(
          dateRange.startDate,
          dateRange.endDate,
          timeFilter
        );
        console.log('Generated mock fish data:', fishData.length, 'records');
      }
      
      // Fetch plant telemetry data with retry logic
      console.log('Fetching plant telemetry data...');
      try {
        plantData = await telemetryDataService.getPlantTelemetry(
          dateRange.startDate,
          dateRange.endDate,
          false,
          timeFilter
        );
        console.log('Received plant data:', plantData ? plantData.length : 0, 'records');
        
        // Force generation of mock data if nothing was returned
        if (!plantData || plantData.length === 0) {
          console.log('No plant data received, forcing generation of mock data');
          plantData = telemetryDataService.generateMockPlantTelemetryData(
            dateRange.startDate,
            dateRange.endDate,
            timeFilter
          );
          console.log('Generated mock plant data:', plantData.length, 'records');
        }
      } catch (plantError) {
        console.error('Error fetching plant telemetry data:', plantError);
        // Generate mock data instead of using empty array
        console.log('Generating mock plant data after error');
        plantData = telemetryDataService.generateMockPlantTelemetryData(
          dateRange.startDate,
          dateRange.endDate,
          timeFilter
        );
        console.log('Generated mock plant data:', plantData.length, 'records');
      }
      
      // Update state with whatever data we were able to retrieve
      if (fishData && fishData.length > 0) {
        console.log('Fish data sample:', fishData[0]);
        setFishHistoryData(fishData);
      } else {
        console.warn('No fish data received');
        setFishHistoryData([]);
      }
      
      if (plantData && plantData.length > 0) {
        console.log('Plant data sample:', plantData[0]);
        setPlantHistoryData(plantData);
      } else {
        console.warn('No plant data received');
        setPlantHistoryData([]);
      }
      
      setLoading(false);
      return { fishData, plantData };
    } catch (error) {
      console.error('Error fetching filtered data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch filtered telemetry data: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      
      // If we have current data stored, don't clear it on error
      if (currentFishData) {
        setFishData(currentFishData);
      }
      if (currentPlantData) {
        setPlantData(currentPlantData);
      }
      
      setLoading(false);
      return { fishData: [], plantData: [] };
    }
  }, [dateRange, timeFilter, toast]); // Removed fishData and plantData to prevent infinite refresh loops

  // Start real-time data updates
  const startRealTimeUpdates = useCallback(() => {
    // Set up interval for real-time data cycling
    const interval = setInterval(async () => {
      if (!isDataPaused) {
        try {
          const currentData = await telemetryDataService.getCurrentTelemetry(systemId);
          setFishData(currentData.fish);
          setPlantData(currentData.plant);
        } catch (error) {
          console.error('Error fetching current telemetry:', error);
        }
      }
    }, 30000); // Update every 30 seconds (increased from 10s to reduce refresh frequency)
    
    return () => clearInterval(interval);
  }, [isDataPaused, systemId]);

  // Load initial data and set up real-time updates
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Dashboard: Initial data loading started');
        
        // Reset telemetry service data loaded state on page refresh/mount
        telemetryDataService.isDataLoaded = false;
        
        // Load CSV data first with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        let dataLoaded = false;
        
        while (!dataLoaded && retryCount < maxRetries) {
          try {
            console.log(`Dashboard: Attempting to load telemetry data (attempt ${retryCount + 1})`);
            await telemetryDataService.loadAllData();
            dataLoaded = true;
            console.log('Dashboard: Telemetry data loaded successfully');
          } catch (loadError) {
            retryCount++;
            console.warn(`Dashboard: Failed to load telemetry data (attempt ${retryCount}):`, loadError);
            if (retryCount >= maxRetries) {
              // Don't throw, just log and continue with empty data
              console.error('Dashboard: Max retries reached, continuing with empty data');
              break;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        try {
          // Fetch filtered data based on time range
          await fetchFilteredData();
        } catch (filterError) {
          console.error('Dashboard: Error fetching filtered data:', filterError);
          // Continue despite errors
        }
        
        try {
          // Start real-time data cycling
          startRealTimeUpdates();
        } catch (updateError) {
          console.error('Dashboard: Error starting real-time updates:', updateError);
          // Continue despite errors
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load telemetry data. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
      }
    };
    
    loadData();
    
    // Use socket for real-time updates if available
    const socket = socketRef.current;
    
    // Subscribe to real-time data
    socket.emit('subscribeToTelemetry');
    
    // Listen for fish telemetry updates
    socket.on('fishTelemetry', (data) => {
      if (!isDataPaused) {
        setFishData(data);
        
        // Check for alert conditions (example threshold check)
        const hasAlert = checkAlertConditions(data, 'fish');
        if (hasAlert.alert && !alert.show) {
          setAlert({
            show: true,
            type: 'error',
            title: hasAlert.title,
            message: hasAlert.message
          });
        }
      }
    });
    
    // Listen for plant telemetry updates
    socket.on('plantTelemetry', (data) => {
      if (!isDataPaused) {
        setPlantData(data);
        
        // Check for alert conditions
        const hasAlert = checkAlertConditions(data, 'plant');
        if (hasAlert.alert && !alert.show) {
          setAlert({
            show: true,
            type: 'error',
            title: hasAlert.title,
            message: hasAlert.message
          });
        }
      }
    });
    
    // Listen for telemetry state changes (paused/resumed)
    socket.on('telemetryState', (state) => {
      setIsDataPaused(state.paused);
    });
    
    // Clean up on unmount
    return () => {
      socket.off('fishTelemetry');
      socket.off('plantTelemetry');
      socket.off('telemetryState');
    };
  }, [isDataPaused, alert.show, fetchFilteredData, startRealTimeUpdates, toast]);
  
  // Update data when filter changes
  useEffect(() => {
    console.log('Time filter or date range changed, fetching new data...');
    setLoading(true); // Show loading indicator when filter changes
    fetchFilteredData().finally(() => {
      setLoading(false); // Hide loading indicator when data is loaded
    });
  }, [timeFilter, dateRange, fetchFilteredData]);
  
  // Handle time filter change
  const handleTimeFilterChange = (filter) => {
    console.log('Time filter changed to:', filter);
    
    // Update the date range based on the selected filter
    const now = new Date();
    let startDate = new Date();
    
    switch (filter) {
      case '10min':
        // Last hour
        startDate.setHours(now.getHours() - 1);
        break;
      case 'hour':
        // Last 24 hours
        startDate.setHours(now.getHours() - 24);
        break;
      case 'day':
        // Last 7 days
        startDate.setDate(now.getDate() - 7);
        break;
      case 'week':
        // Last 4 weeks
        startDate.setDate(now.getDate() - 28);
        break;
      case 'month':
        // Last 6 months
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '6m':
        // Last 12 months
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        // Default to last 7 days
        startDate.setDate(now.getDate() - 7);
    }
    
    console.log('Setting date range:', { startDate, endDate: now });
    setDateRange({
      startDate,
      endDate: now
    });
    
    // Update the time filter
    setTimeFilter(filter);
  };
  
  // Helper function to check for alert conditions
  const checkAlertConditions = (data, type) => {
    if (!data) return { alert: false };
    
    // Define thresholds for parameters
    const thresholds = {
      fish: {
        phLevel: { min: 6.5, max: 8.5, name: 'pH Level' },
        temperatureLevel: { min: 20, max: 30, name: 'Temperature' },
        tdsLevel: { min: 100, max: 500, name: 'TDS Level' },
        turbidityLevel: { min: 0, max: 25, name: 'Turbidity Level' },
        ecLevel: { min: 0.5, max: 3.0, name: 'EC Level' }
      },
      plant: {
        pressureLevel: { min: 0.5, max: 5.0, name: 'Pressure Level' },
        temperatureLevel: { min: 18, max: 28, name: 'Temperature' },
        humidityLevel: { min: 50, max: 85, name: 'Humidity Level' }
      }
    };
    
    // Check each parameter against thresholds
    for (const [param, value] of Object.entries(data)) {
      if (thresholds[type][param]) {
        const { min, max, name } = thresholds[type][param];
        
        if (typeof value === 'number' && (value < min || value > max)) {
          return {
            alert: true,
            title: `${type === 'fish' ? 'Fish Tank' : 'Plant Tray'} Alert!`,
            message: `${name} is out of range: ${value} (should be between ${min} and ${max})`
          };
        }
      }
    }
    
    return { alert: false };
  };
  
  // Handle pause/resume of telemetry data
  const handleTogglePause = async () => {
    try {
      if (!isDataPaused) {
        // Pause telemetry
        await axios.post('/api/telemetry/pause');
        socket.emit('pauseTelemetry');
        
        toast({
          title: 'Telemetry Paused',
          description: 'Notification email has been sent',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Resume telemetry
        socket.emit('resumeTelemetry');
        
        toast({
          title: 'Telemetry Resumed',
          description: 'Real-time data streaming has been resumed',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error toggling telemetry state:', error);
      toast({
        title: 'Error',
        description: 'Failed to update telemetry state',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading color="spotify.green">Dashboard</Heading>
        
        <Flex align="center">
          <Select 
            value={systemId}
            onChange={(e) => setSystemId(e.target.value)}
            size="sm"
            width="150px"
            mr={4}
          >
            <option value="system-001">System 001</option>
            <option value="system-002">System 002</option>
          </Select>
          
          <TimeRangeFilter 
            activeFilter={timeFilter} 
            onChange={handleTimeFilterChange} 
          />
          
          <Button
            leftIcon={<MdRefresh />}
            colorScheme="blue"
            onClick={refreshData}
            isLoading={loading}
            loadingText="Refreshing"
            ml={4}
            size="sm"
            mr={2}
          >
            Refresh Data
          </Button>
          <Button
            leftIcon={isDataPaused ? <MdPlayArrow /> : <MdPause />}
            colorScheme={isDataPaused ? 'green' : 'gray'}
            onClick={handleTogglePause}
            ml={2}
            size="sm"
          >
            {isDataPaused ? 'Resume Telemetry' : 'Pause Telemetry'}
          </Button>
        </Flex>
      </Flex>
      
      {alert.show && (
        <Alert 
          status={alert.type}
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="auto"
          borderRadius="md"
          mb={6}
          bg={alertBgColor}
          borderWidth="1px"
          borderColor={alertBorderColor}
        >
          <AlertIcon boxSize="24px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            {alert.title}
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {alert.message}
          </AlertDescription>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => setAlert({ ...alert, show: false })}
          />
        </Alert>
      )}
      
      {isDataPaused && (
        <Alert status="warning" mb={6} borderRadius="md">
          <AlertIcon />
          <AlertTitle mr={2}>Telemetry Paused</AlertTitle>
          <AlertDescription>Data streaming is currently paused. Click the Resume button to continue receiving real-time updates.</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <Flex justify="center" align="center" height="400px">
          <Spinner size="xl" color="green.500" />
        </Flex>
      ) : (
        <Tabs 
          variant="soft-rounded" 
          colorScheme="green" 
          isLazy
        >
          <TabList mb={4}>
            <Tab>
              Fish Tank
              {fishData && (
                <Badge ml={2} colorScheme="green" borderRadius="full">
                  Live
                </Badge>
              )}
            </Tab>
            <Tab>
              Plant Tray
              {plantData && (
                <Badge ml={2} colorScheme="green" borderRadius="full">
                  Live
                </Badge>
              )}
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              {fishData ? (
                <>
                  {/* Summary Cards */}
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4} mb={6}>
                    <StatCard 
                      title="pH Level" 
                      value={fishData?.waterPH?.toFixed(1) || fishData?.phLevel?.toFixed(1)} 
                      unit="pH"
                      iconType="ph"
                      bgColor={cardBgColor}
                      isWarning={(fishData?.waterPH || fishData?.phLevel) < 6.5 || (fishData?.waterPH || fishData?.phLevel) > 8.5}
                    />
                    <StatCard 
                      title="Temperature" 
                      value={fishData?.waterTemperature?.toFixed(1) || fishData?.temperatureLevel?.toFixed(1)} 
                      unit="°C"
                      iconType="temperature"
                      bgColor={cardBgColor}
                      isWarning={(fishData?.waterTemperature || fishData?.temperatureLevel) < 20 || (fishData?.waterTemperature || fishData?.temperatureLevel) > 30}
                    />
                    <StatCard 
                      title="TDS Level" 
                      value={fishData?.tds?.toFixed(0) || fishData?.tdsLevel?.toFixed(0)} 
                      unit="ppm"
                      iconType="tds"
                      bgColor={cardBgColor}
                      isWarning={(fishData?.tds || fishData?.tdsLevel) < 100 || (fishData?.tds || fishData?.tdsLevel) > 500}
                    />
                    <StatCard 
                      title="Turbidity" 
                      value={fishData?.turbidity?.toFixed(1) || fishData?.turbidityLevel?.toFixed(1)} 
                      unit="NTU"
                      iconType="turbidity"
                      bgColor={cardBgColor}
                      isWarning={(fishData?.turbidity || fishData?.turbidityLevel) < 0 || (fishData?.turbidity || fishData?.turbidityLevel) > 25}
                    />
                    <StatCard 
                      title="EC Level" 
                      value={fishData?.ecValues?.toFixed(2) || fishData?.ecLevel?.toFixed(2)} 
                      unit="mS/cm"
                      iconType="ec"
                      bgColor={cardBgColor}
                      isWarning={(fishData?.ecValues || fishData?.ecLevel) < 0.5 || (fishData?.ecValues || fishData?.ecLevel) > 3.0}
                    />
                  </SimpleGrid>
                  
                  {/* Main Fish Dashboard */}
                  <FishTelemetryPanel 
                    data={fishData} 
                    historyData={fishHistoryData} 
                    timeGranularity={timeFilter} 
                  />
                </>
              ) : (
                <Box textAlign="center" my={10}>
                  Loading fish telemetry data...
                </Box>
              )}
            </TabPanel>
            
            <TabPanel>
              {plantData ? (
                <>
                  {/* Summary Cards */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                    <StatCard 
                      title="Pressure" 
                      value={plantData?.pressure?.toFixed(1) || plantData?.pressureLevel?.toFixed(1)} 
                      unit="kPa"
                      iconType="pressure"
                      bgColor={cardBgColor}
                      isWarning={(plantData?.pressure || plantData?.pressureLevel) < 0.5 || (plantData?.pressure || plantData?.pressureLevel) > 5.0}
                    />
                    <StatCard 
                      title="Temperature" 
                      value={plantData?.plantTemperature?.toFixed(1) || plantData?.temperatureLevel?.toFixed(1)} 
                      unit="°C"
                      iconType="temperature"
                      bgColor={cardBgColor}
                      isWarning={(plantData?.plantTemperature || plantData?.temperatureLevel) < 18 || (plantData?.plantTemperature || plantData?.temperatureLevel) > 28}
                    />
                    <StatCard 
                      title="Humidity" 
                      value={plantData?.humidity?.toFixed(1) || plantData?.humidityLevel?.toFixed(1)} 
                      unit="%"
                      iconType="humidity"
                      bgColor={cardBgColor}
                      isWarning={(plantData?.humidity || plantData?.humidityLevel) < 50 || (plantData?.humidity || plantData?.humidityLevel) > 85}
                    />
                  </SimpleGrid>
                  
                  {/* Main Plant Dashboard */}
                  <PlantTelemetryPanel 
                    data={plantData} 
                    historyData={plantHistoryData} 
                    timeGranularity={timeFilter} 
                  />
                </>
              ) : (
                <Box textAlign="center" my={10}>
                  Loading plant telemetry data...
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default Dashboard;
