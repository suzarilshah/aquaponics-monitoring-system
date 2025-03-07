import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Flex h="100vh" overflow="hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <Box 
        flex="1"
        bg={bgColor}
        ml={{ base: 0, md: '250px' }}
        transition="margin-left 0.3s"
        overflow="auto"
      >
        <Navbar />
        <Box p={4} mt={16}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
};

export default Layout;
