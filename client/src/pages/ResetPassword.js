import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
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
  InputGroup,
  InputRightElement,
  IconButton,
  Center,
  Flex,
  Icon,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { MdVisibility, MdVisibilityOff, MdWaterDrop } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const { resetToken } = useParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const formBackground = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await resetPassword(formData.password, resetToken);
      
      if (result.success) {
        setIsSuccess(true);
        toast.success('Password has been reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(result.error || 'Failed to reset password');
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
              Reset Password
            </Heading>
            
            {isSuccess ? (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Text>
                  Your password has been reset successfully! You will be redirected to the login page shortly.
                </Text>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
                  <FormControl id="password" isInvalid={!!errors.password}>
                    <FormLabel>New Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your new password"
                      />
                      <InputRightElement>
                        <IconButton
                          variant="ghost"
                          icon={showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl id="confirmPassword" isInvalid={!!errors.confirmPassword}>
                    <FormLabel>Confirm New Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your new password"
                      />
                      <InputRightElement>
                        <IconButton
                          variant="ghost"
                          icon={showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
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
                      loadingText="Resetting"
                      mt={4}
                    >
                      Reset Password
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

export default ResetPassword;
