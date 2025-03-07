import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Link,
  Heading,
  Text,
  useColorModeValue,
  FormErrorMessage,
  Center,
  Flex,
  Icon,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { MdWaterDrop } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const formBackground = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };
  
  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setIsSuccess(true);
        toast.success('Reset email sent successfully!');
      } else {
        toast.error(result.error || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.900')}
    >
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Center mb={4}>
          <Flex align="center">
            <Icon as={MdWaterDrop} boxSize={10} color="spotify.green" mr={2} />
            <Heading color="spotify.green" size="xl">Aquaponics</Heading>
          </Flex>
        </Center>
        
        <Box
          rounded={'lg'}
          bg={formBackground}
          boxShadow={'lg'}
          p={8}
          width={{ base: 'sm', md: 'md' }}
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Stack spacing={4}>
            <Heading size="lg" textAlign="center" mb={4}>
              Forgot Password
            </Heading>
            
            {isSuccess ? (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Text>
                  Password reset link sent to your email. Please check your inbox.
                </Text>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
                  <Text>
                    Enter your email address and we'll send you a link to reset your password.
                  </Text>
                  
                  <FormControl id="email" isInvalid={!!error}>
                    <FormLabel>Email address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                    />
                    <FormErrorMessage>{error}</FormErrorMessage>
                  </FormControl>
                  
                  <Stack spacing={5}>
                    <Button
                      bg={'spotify.green'}
                      color={'white'}
                      _hover={{
                        bg: 'brand.600',
                      }}
                      type="submit"
                      isLoading={isSubmitting}
                      loadingText="Sending"
                    >
                      Send Reset Link
                    </Button>
                    
                    <Text align={'center'}>
                      Remember your password?{' '}
                      <Link as={RouterLink} to="/login" color={'spotify.green'}>
                        Back to Login
                      </Link>
                    </Text>
                  </Stack>
                </Stack>
              </form>
            )}
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
};

export default ForgotPassword;
