import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import AIAnalysisPanel from '../components/dashboard/AIAnalysisPanel';

const AIAnalysis = () => {
  return (
    <Container maxW="container.xl" py={5}>
      <Box mb={6}>
        <AIAnalysisPanel />
      </Box>
    </Container>
  );
};

export default AIAnalysis;
