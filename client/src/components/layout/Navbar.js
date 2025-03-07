import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Heading,
  useColorModeValue,
  Badge,
  HStack,
  Text,
} from '@chakra-ui/react';
import { MdOutlineLogout, MdSettings, MdNotifications } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  return (
    <Box
      px={4}
      height="16"
      position="fixed"
      width={{ base: '100%', md: 'calc(100% - 250px)' }}
      zIndex="5"
      bg={bgColor}
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      boxShadow="sm"
    >
      <Flex h="100%" alignItems="center" justifyContent="space-between">
        {/* Page title - would be dynamic in a real app */}
        <Heading size="md" color="spotify.green">
          Aquaponics Monitoring System
        </Heading>

        {/* Right side user menu */}
        <HStack spacing={4}>
          {/* Notification icon */}
          <Box position="relative">
            <IconButton
              aria-label="Notifications"
              icon={<MdNotifications />}
              variant="ghost"
              fontSize="20px"
            />
            <Badge
              position="absolute"
              top="-2px"
              right="-2px"
              colorScheme="green"
              variant="solid"
              borderRadius="full"
              boxSize="1.25rem"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              1
            </Badge>
          </Box>

          {/* User menu */}
          {user && (
            <Menu>
              <MenuButton
                as={IconButton}
                icon={
                  <Avatar
                    size="sm"
                    name={user.name}
                    bg="spotify.green"
                    color="white"
                  />
                }
                variant="ghost"
              />
              <MenuList>
                <Box px={3} py={2}>
                  <Text fontWeight="bold">{user.name}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {user.email}
                  </Text>
                </Box>
                <MenuDivider />
                <MenuItem icon={<MdSettings />} onClick={navigateToSettings}>
                  Settings
                </MenuItem>
                <MenuItem icon={<MdOutlineLogout />} onClick={handleLogout}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
