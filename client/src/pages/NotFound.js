import React from 'react';
import { Box, Heading, Text, Button, VStack, useColorModeValue } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="80vh"
      p={8}
    >
      <VStack
        spacing={6}
        p={8}
        borderRadius="lg"
        bg={bgColor}
        boxShadow="md"
        maxW="md"
        textAlign="center"
      >
        <Heading as="h1" size="xl" color="spotify.green">
          404
        </Heading>
        <Heading as="h2" size="lg" color={textColor}>
          Page Not Found
        </Heading>
        <Text color={textColor}>
          The page you are looking for does not exist or has been moved.
        </Text>
        <Button
          as={Link}
          to="/"
          colorScheme="green"
          variant="solid"
          size="lg"
        >
          Back to Dashboard
        </Button>
      </VStack>
    </Box>
  );
};

export default NotFound;
