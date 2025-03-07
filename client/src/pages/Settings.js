import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  useColorModeValue,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  IconButton,
  Switch,
  useColorMode,
  Divider,
  Card,
  CardBody,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
} from '@chakra-ui/react';
import { MdVisibility, MdVisibilityOff, MdSave } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notificationEmail: user?.settings?.notificationEmail || user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  
  const [darkMode, setDarkMode] = useState(colorMode === 'dark');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  
  const cardBg = useColorModeValue('white', 'gray.800');
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
  
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    toggleColorMode();
  };
  
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.notificationEmail) {
      newErrors.notificationEmail = 'Notification email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.notificationEmail)) {
      newErrors.notificationEmail = 'Notification email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
    }
    
    if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await updateProfile({
        name: formData.name,
        email: formData.email,
        settings: {
          darkMode,
          notificationEmail: formData.notificationEmail,
        },
      });
      
      if (result.success) {
        setAlert({
          show: true,
          type: 'success',
          message: 'Profile updated successfully!',
        });
        toast.success('Profile updated successfully!');
      } else {
        setAlert({
          show: true,
          type: 'error',
          message: result.error || 'Failed to update profile',
        });
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'An unexpected error occurred',
      });
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await updateProfile({
        password: formData.newPassword,
        currentPassword: formData.currentPassword,
      });
      
      if (result.success) {
        setAlert({
          show: true,
          type: 'success',
          message: 'Password updated successfully!',
        });
        toast.success('Password updated successfully!');
        
        // Clear password fields
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } else {
        setAlert({
          show: true,
          type: 'error',
          message: result.error || 'Failed to update password',
        });
        toast.error(result.error || 'Failed to update password');
      }
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'An unexpected error occurred',
      });
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box>
      <Heading mb={6} color="spotify.green">Settings</Heading>
      
      {alert.show && (
        <Alert 
          status={alert.type} 
          variant="solid" 
          mb={6}
          borderRadius="md"
        >
          <AlertIcon />
          <AlertTitle mr={2}>
            {alert.type === 'success' ? 'Success!' : 'Error!'}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
          <CloseButton 
            position="absolute" 
            right="8px" 
            top="8px" 
            onClick={() => setAlert({ ...alert, show: false })}
          />
        </Alert>
      )}
      
      <VStack spacing={6} align="stretch">
        {/* Profile Settings */}
        <Card 
          bg={cardBg} 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          borderRadius="lg"
        >
          <CardBody>
            <Heading size="md" mb={4}>Profile Settings</Heading>
            <form onSubmit={handleProfileSubmit}>
              <Stack spacing={4}>
                <FormControl id="name" isInvalid={!!errors.name}>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                  />
                  <FormErrorMessage>{errors.name}</FormErrorMessage>
                </FormControl>
                
                <FormControl id="email" isInvalid={!!errors.email}>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your email"
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>
                
                <FormControl id="notificationEmail" isInvalid={!!errors.notificationEmail}>
                  <FormLabel>Notification Email</FormLabel>
                  <Input
                    type="email"
                    name="notificationEmail"
                    value={formData.notificationEmail}
                    onChange={handleChange}
                    placeholder="Email for notifications"
                  />
                  <FormErrorMessage>{errors.notificationEmail}</FormErrorMessage>
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="dark-mode" mb="0">
                    Dark Mode
                  </FormLabel>
                  <Switch
                    id="dark-mode"
                    isChecked={darkMode}
                    onChange={handleDarkModeToggle}
                    colorScheme="green"
                  />
                </FormControl>
                
                <Button
                  mt={4}
                  bg="spotify.green"
                  color="white"
                  _hover={{ bg: 'brand.600' }}
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Saving"
                  leftIcon={<MdSave />}
                >
                  Save Changes
                </Button>
              </Stack>
            </form>
          </CardBody>
        </Card>
        
        {/* Password Settings */}
        <Card 
          bg={cardBg} 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          borderRadius="lg"
        >
          <CardBody>
            <Heading size="md" mb={4}>Change Password</Heading>
            <form onSubmit={handlePasswordSubmit}>
              <Stack spacing={4}>
                <FormControl id="currentPassword" isInvalid={!!errors.currentPassword}>
                  <FormLabel>Current Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter your current password"
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
                  <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
                </FormControl>
                
                <FormControl id="newPassword" isInvalid={!!errors.newPassword}>
                  <FormLabel>New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
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
                  <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
                </FormControl>
                
                <FormControl id="confirmNewPassword" isInvalid={!!errors.confirmNewPassword}>
                  <FormLabel>Confirm New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmNewPassword"
                      value={formData.confirmNewPassword}
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
                  <FormErrorMessage>{errors.confirmNewPassword}</FormErrorMessage>
                </FormControl>
                
                <Button
                  mt={4}
                  bg="spotify.green"
                  color="white"
                  _hover={{ bg: 'brand.600' }}
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Updating"
                >
                  Update Password
                </Button>
              </Stack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default Settings;
