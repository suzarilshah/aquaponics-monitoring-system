import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  Tag, 
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  VStack,
  HStack,
  Badge,
  useToast,
  useColorModeValue,
  Select,
  Tooltip,
  Progress,
  Icon,
  Flex,
  Spacer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  CircularProgress,
  CircularProgressLabel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { aiAnalysisService } from '../services/aiAnalysisService';
import telemetryDataService from '../services/telemetryDataService';
import Papa from 'papaparse';
import { AI_MODELS } from '../config/aiModels';

const AnalysisDetails = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [selectedModel, setSelectedModel] = useState('ensemble');
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const alertBg = useColorModeValue('red.50', 'red.900');
  const successBg = useColorModeValue('green.50', 'green.900');
  const highlightColor = useColorModeValue('blue.100', 'blue.700');
  
  useEffect(() => {
    // Load analysis history when component mounts
    const loadAnalysisHistory = async () => {
      try {
        const history = await aiAnalysisService.getAnalysisHistory();
        setAnalysisHistory(history);
      } catch (error) {
        console.error('Error loading analysis history:', error);
      }
    };
    
    loadAnalysisHistory();
  }, []);

  const runAIAnalysis = async () => {
    try {
      setIsRunningAnalysis(true);
      setError(null);

      // Load initial and validation data
      if (!telemetryDataService.isDataLoaded) {
        await telemetryDataService.loadAllData();
      }

      // Prepare data for AI analysis
      const initialData = {
        fish: telemetryDataService.fishInitialData,
        plant: telemetryDataService.plantInitialData
      };

      const validationData = {
        fish: telemetryDataService.fishValidateData,
        plant: telemetryDataService.plantValidateData
      };

      // Run AI analysis using the service with selected model
      const result = await aiAnalysisService.runAnalysis(initialData, validationData, selectedModel);
      setAiResult(result);
      
      // Set confidence score if available
      if (result.confidence_score) {
        setConfidenceScore(result.confidence_score);
      }
      
      // Refresh analysis history
      const history = await aiAnalysisService.getAnalysisHistory();
      setAnalysisHistory(history);
      
      toast({
        title: 'Analysis Complete',
        description: `AI analysis using ${AI_MODELS[selectedModel]?.name || 'Ensemble'} model completed successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error running AI analysis:', error);
      setError('Failed to complete AI analysis. Please try again.');
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to complete AI analysis',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  useEffect(() => {
    const fetchAnalysisDetails = async () => {
      try {
        setIsLoading(true);
        if (id) {
          const analysisData = await aiAnalysisService.getAnalysisById(id);
          setAnalysis(analysisData);
        } else {
          // For demo purposes, create sample data
          const sampleAnalysis = {
            id: '1234567890',
            modelUsed: 'Deepseek R1',
            timestamp: new Date().toISOString(),
            accuracy: 0.92,
            comparisons: {
              fish: {
                phLevel: { actual: 7.2, predicted: 7.3, difference: 0.1, percentDiff: 1.4 },
                temperatureLevel: { actual: 25.3, predicted: 25.7, difference: 0.4, percentDiff: 1.6 },
                tdsLevel: { actual: 320, predicted: 315, difference: 5, percentDiff: 1.6 },
                turbidityLevel: { actual: 15.5, predicted: 16.0, difference: 0.5, percentDiff: 3.2 },
                ecLevel: { actual: 1.8, predicted: 1.9, difference: 0.1, percentDiff: 5.6 }
              },
              plant: {
                pressureLevel: { actual: 2.3, predicted: 2.4, difference: 0.1, percentDiff: 4.3 },
                temperatureLevel: { actual: 24.1, predicted: 24.5, difference: 0.4, percentDiff: 1.7 },
                humidityLevel: { actual: 68.4, predicted: 70.1, difference: 1.7, percentDiff: 2.5 }
              }
            },
            recommendations: [
              "Consider adjusting the pH level in the fish tank slightly to maintain optimal conditions",
              "The temperature in both systems is within ideal range, no adjustments needed",
              "Humidity levels in the plant tray may need monitoring over the next 24 hours"
            ]
          };
          setAnalysis(sampleAnalysis);
        }
      } catch (error) {
        console.error('Error fetching analysis details:', error);
        setError('Failed to load analysis details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalysisDetails();
  }, [id]);
  
  if (isLoading) {
    return (
      <Container maxW="container.xl" py={5}>
        <Box p={8} textAlign="center">
          <Text>Loading analysis details...</Text>
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxW="container.xl" py={5}>
        <Box p={8} textAlign="center">
          <Text color="red.500">{error}</Text>
        </Box>
      </Container>
    );
  }
  
  if (!analysis) {
    return (
      <Container maxW="container.xl" py={5}>
        <Box p={8} textAlign="center">
          <Text>Analysis not found</Text>
        </Box>
      </Container>
    );
  }
  
  const renderPromptTemplate = () => {
    if (!aiResult || !aiResult.prompt_template) return null;
    
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor} mt={4}>
        <Accordion allowToggle>
          <AccordionItem border="none">
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading size="md">Model Prompt Template</Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Text whiteSpace="pre-wrap" fontFamily="monospace" fontSize="sm">
                {aiResult.prompt_template}
              </Text>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>
    );
  };
  
  const renderAIResults = () => {
    if (!aiResult) return null;

    return (
      <VStack spacing={4} align="stretch" w="100%">
        {/* Goldfish Health Section */}
        <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor}>
          <Heading size="md" mb={4}>Goldfish Health Analysis</Heading>
          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Heading size="sm">pH Trend</Heading>
              <Text>Next 30 Days: {aiResult.Goldfish_Health.pH_Trend.next_30d}</Text>
              <Text color="green.500">Action: {aiResult.Goldfish_Health.pH_Trend.action}</Text>
            </Box>
            <Box>
              <Heading size="sm">Ammonia Risk</Heading>
              <Text>Probability: {aiResult.Goldfish_Health.Ammonia_Risk.probability}</Text>
              <Text>Peak Day: {aiResult.Goldfish_Health.Ammonia_Risk.peak_day}</Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Spearmint Growth Section */}
        <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor}>
          <Heading size="md" mb={4}>Spearmint Growth Analysis</Heading>
          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Heading size="sm">Harvest Readiness</Heading>
              <Text>Optimal Date: {aiResult.Spearmint_Growth.Harvest_Readiness.optimal_date}</Text>
            </Box>
            <Box>
              <Heading size="sm">Nutrient Status</Heading>
              <Text>Nitrogen: {aiResult.Spearmint_Growth.Nutrient_Deficit.nitrogen}</Text>
              <Text color="green.500">Fix: {aiResult.Spearmint_Growth.Nutrient_Deficit.fix}</Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* System Risk Section */}
        <Alert
          status="warning"
          variant="subtle"
          flexDirection="column"
          alignItems="flex-start"
          p={4}
          borderRadius="lg"
        >
          <AlertTitle mb={1}>System Risk Alert</AlertTitle>
          <AlertDescription>
            <Text>Severity: {aiResult.System_Risk['pH-EC_Imbalance'].severity}</Text>
            <Text>Impact: {aiResult.System_Risk['pH-EC_Imbalance'].impact}</Text>
          </AlertDescription>
        </Alert>

        {/* Urgent Alerts */}
        {aiResult.urgent && (
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="flex-start"
            p={4}
            borderRadius="lg"
          >
            <AlertTitle mb={1}>{aiResult.urgent.title}</AlertTitle>
            <AlertDescription>
              Action Required: {aiResult.urgent.action}
            </AlertDescription>
          </Alert>
        )}

        {/* Watch Alerts */}
        {aiResult.watch && (
          <Alert
            status="info"
            variant="subtle"
            flexDirection="column"
            alignItems="flex-start"
            p={4}
            borderRadius="lg"
          >
            <AlertTitle mb={1}>{aiResult.watch.title}</AlertTitle>
            <AlertDescription>
              Recommended Action: {aiResult.watch.action}
            </AlertDescription>
          </Alert>
        )}
      </VStack>
    );
  };

  const downloadDataset = async (type, dataset) => {
    try {
      let data;
      if (type === 'fish') {
        data = dataset === 'initial' ? telemetryDataService.fishInitialData : telemetryDataService.fishValidateData;
      } else {
        data = dataset === 'initial' ? telemetryDataService.plantInitialData : telemetryDataService.plantValidateData;
      }

      const csvContent = Papa.unparse(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${type}_${dataset}_data.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading dataset:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the dataset. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <VStack spacing={6} align="stretch">
        <Box bg={bgColor} borderRadius="lg" p={6} borderWidth="1px" borderColor={borderColor}>
          <VStack spacing={4} align="stretch">
            <HStack justifyContent="space-between" alignItems="center">
              <Heading size="lg" color={textColor}>AI Analysis Dashboard</Heading>
              <HStack spacing={4}>
                <Select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  width="200px"
                  disabled={isRunningAnalysis}
                >
                  {Object.entries(AI_MODELS).map(([key, model]) => (
                    <option key={key} value={key}>{model.name}</option>
                  ))}
                </Select>
                <Button
                  colorScheme="green"
                  onClick={runAIAnalysis}
                  isLoading={isRunningAnalysis}
                  loadingText="Running Analysis"
                  disabled={isRunningAnalysis}
                >
                  Run AI Analysis
                </Button>
              </HStack>
            </HStack>
            
            {AI_MODELS[selectedModel]?.description && (
              <Text fontSize="sm" color="gray.600" textAlign="right">
                {AI_MODELS[selectedModel].description}
              </Text>
            )}

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" />
                <Text mt={4}>Loading analysis details...</Text>
              </Box>
            ) : aiResult ? (
              <>
                {confidenceScore > 0 && (
                  <Flex justifyContent="flex-end" mb={4}>
                    <Box textAlign="center">
                      <Text fontSize="sm" mb={1}>Analysis Confidence</Text>
                      <CircularProgress value={confidenceScore * 100} color={confidenceScore > 0.85 ? 'green.400' : confidenceScore > 0.7 ? 'yellow.400' : 'red.400'} size="70px">
                        <CircularProgressLabel>{Math.round(confidenceScore * 100)}%</CircularProgressLabel>
                      </CircularProgress>
                    </Box>
                  </Flex>
                )}
                {renderAIResults()}
                {renderPromptTemplate()}
              </>
            ) : (
              <Box textAlign="center" py={10}>
                <Text>Click "Run AI Analysis" to generate insights from your aquaponics data.</Text>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Analysis History Section */}
        {analysisHistory && analysisHistory.length > 0 && (
          <Box bg={bgColor} borderRadius="lg" p={6} borderWidth="1px" borderColor={borderColor}>
            <VStack spacing={4} align="stretch">
              <Heading size="md" color={textColor}>Analysis History</Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Model</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {analysisHistory.slice(0, 5).map((item) => (
                    <Tr key={item.id}>
                      <Td>{new Date(item.timestamp).toLocaleString()}</Td>
                      <Td>{item.modelUsed}</Td>
                      <Td>
                        <Button 
                          size="xs" 
                          colorScheme="blue" 
                          variant="outline"
                          as="a" 
                          href={`/analysis/${item.id}`}
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          </Box>
        )}
        
        {/* Dataset Download Section */}
        <Box bg={bgColor} borderRadius="lg" p={6} borderWidth="1px" borderColor={borderColor}>
          <VStack spacing={4} align="stretch">
            <Heading size="md" color={textColor}>Download Datasets</Heading>
            
            <SimpleGrid columns={2} spacing={6}>
              {/* Fish Data Downloads */}
              <Box>
                <Heading size="sm" mb={3}>Fish Telemetry Data</Heading>
                <VStack spacing={2} align="stretch">
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => downloadDataset('fish', 'initial')}
                  >
                    Download Initial Dataset (Mar-May 2024)
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => downloadDataset('fish', 'validate')}
                  >
                    Download Validation Dataset (Jun-Aug 2024)
                  </Button>
                </VStack>
              </Box>

              {/* Plant Data Downloads */}
              <Box>
                <Heading size="sm" mb={3}>Plant Telemetry Data</Heading>
                <VStack spacing={2} align="stretch">
                  <Button
                    size="sm"
                    colorScheme="green"
                    variant="outline"
                    onClick={() => downloadDataset('plant', 'initial')}
                  >
                    Download Initial Dataset (Mar-May 2024)
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="green"
                    variant="outline"
                    onClick={() => downloadDataset('plant', 'validate')}
                  >
                    Download Validation Dataset (Jun-Aug 2024)
                  </Button>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default AnalysisDetails;
