import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container,
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel,
  useColorModeValue
} from '@chakra-ui/react';
import axios from 'axios';
import FishTelemetryPanel from '../components/dashboard/FishTelemetryPanel';
import PlantTelemetryPanel from '../components/dashboard/PlantTelemetryPanel';

const TelemetryData = () => {
  const [fishData, setFishData] = useState(null);
  const [plantData, setPlantData] = useState(null);
  const [fishHistorical, setFishHistorical] = useState([]);
  const [plantHistorical, setPlantHistorical] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch latest fish data
        const fishResponse = await axios.get('/api/telemetry/fish/latest');
        setFishData(fishResponse.data);
        
        // Fetch latest plant data
        const plantResponse = await axios.get('/api/telemetry/plant/latest');
        setPlantData(plantResponse.data);
        
        // Fetch historical fish data (last 24 hours)
        const fishHistoryResponse = await axios.get('/api/telemetry/fish/history');
        setFishHistorical(fishHistoryResponse.data);
        
        // Fetch historical plant data (last 24 hours)
        const plantHistoryResponse = await axios.get('/api/telemetry/plant/history');
        setPlantHistorical(plantHistoryResponse.data);
      } catch (error) {
        console.error('Error fetching telemetry data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Poll for updated data every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // For demo purposes, generate sample data if none is available from API
  useEffect(() => {
    if (isLoading && !fishData && !plantData) {
      // Sample fish telemetry data
      const sampleFishData = {
        phLevel: 7.2,
        temperatureLevel: 25.3,
        tdsLevel: 320,
        turbidityLevel: 15.5,
        ecLevel: 1.8,
        timestamp: new Date().toISOString()
      };
      
      // Sample plant telemetry data
      const samplePlantData = {
        pressureLevel: 2.3,
        temperatureLevel: 24.1,
        humidityLevel: 68.4,
        timestamp: new Date().toISOString()
      };
      
      // Sample historical data
      const sampleFishHistorical = Array(24).fill().map((_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - (24 - i));
        
        return {
          phLevel: 7.0 + Math.random() * 1.0,
          temperatureLevel: 24 + Math.random() * 3,
          tdsLevel: 300 + Math.random() * 50,
          turbidityLevel: 14 + Math.random() * 4,
          ecLevel: 1.6 + Math.random() * 0.6,
          timestamp: date.toISOString()
        };
      });
      
      const samplePlantHistorical = Array(24).fill().map((_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - (24 - i));
        
        return {
          pressureLevel: 2.0 + Math.random() * 0.8,
          temperatureLevel: 23 + Math.random() * 3,
          humidityLevel: 65 + Math.random() * 10,
          timestamp: date.toISOString()
        };
      });
      
      setFishData(sampleFishData);
      setPlantData(samplePlantData);
      setFishHistorical(sampleFishHistorical);
      setPlantHistorical(samplePlantHistorical);
      setIsLoading(false);
    }
  }, [isLoading, fishData, plantData]);
  
  return (
    <Container maxW="container.xl" py={5}>
      <Box bg={bgColor} borderRadius="lg" p={4}>
        <Tabs variant="enclosed" colorScheme="green" isFitted>
          <TabList>
            <Tab _selected={{ bg: 'spotify.green', color: 'white' }}>Fish Tank</Tab>
            <Tab _selected={{ bg: 'spotify.green', color: 'white' }}>Plant Tray</Tab>
          </TabList>
          
          <TabPanels mt={4}>
            <TabPanel p={0}>
              <FishTelemetryPanel 
                data={fishData} 
                historicalData={fishHistorical} 
                isLoading={isLoading} 
              />
            </TabPanel>
            <TabPanel p={0}>
              <PlantTelemetryPanel 
                data={plantData} 
                historicalData={plantHistorical} 
                isLoading={isLoading} 
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default TelemetryData;
