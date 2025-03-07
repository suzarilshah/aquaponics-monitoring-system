import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  HStack,
  Avatar,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useColorModeValue,
  Spinner,
  Tooltip
} from '@chakra-ui/react';
import { ChatIcon, ArrowUpIcon } from '@chakra-ui/icons';
import { chatbotService } from '../services/chatbotService';

const Chatbot = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const userBubbleColor = useColorModeValue('blue.100', 'blue.700');
  const botBubbleColor = useColorModeValue('gray.100', 'gray.700');

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session from localStorage on component mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chatSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadChatHistory(savedSessionId);
    }
  }, []);

  // Load chat history for a session
  const loadChatHistory = async (sid) => {
    if (!sid) return;
    
    try {
      setIsLoading(true);
      const response = await chatbotService.getChatHistory(sid);
      if (response.history) {
        setMessages(response.history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // If session not found, create a new one
      setSessionId(null);
      localStorage.removeItem('chatSessionId');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to chatbot
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      setIsLoading(true);
      const response = await chatbotService.sendMessage(input, sessionId);
      
      // Update session ID if new
      if (response.sessionId && response.sessionId !== sessionId) {
        setSessionId(response.sessionId);
        localStorage.setItem('chatSessionId', response.sessionId);
      }
      
      // Add bot response to messages
      if (response.message) {
        setMessages(prev => [...prev, response.message]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  // Start a new chat session
  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem('chatSessionId');
  };

  // Render message bubbles
  const renderMessages = () => {
    return messages.map((msg, index) => (
      <Flex
        key={index}
        w="100%"
        justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}
        mb={2}
      >
        {msg.role === 'assistant' && (
          <Avatar size="sm" name="Aquaponics Assistant" bg="green.500" mr={2} />
        )}
        <Box
          maxW="80%"
          p={3}
          borderRadius="lg"
          bg={msg.role === 'user' ? userBubbleColor : botBubbleColor}
        >
          <Text>{msg.content}</Text>
          <Text fontSize="xs" color="gray.500" textAlign="right" mt={1}>
            {new Date(msg.timestamp).toLocaleTimeString()}
          </Text>
        </Box>
        {msg.role === 'user' && (
          <Avatar size="sm" name="User" bg="blue.500" ml={2} />
        )}
      </Flex>
    ));
  };

  return (
    <>
      {/* Chat button */}
      <Tooltip label="Aquaponics Assistant" placement="left">
        <IconButton
          icon={<ChatIcon />}
          colorScheme="green"
          borderRadius="full"
          position="fixed"
          bottom="20px"
          right="20px"
          size="lg"
          shadow="md"
          onClick={onOpen}
          zIndex={3}
        />
      </Tooltip>

      {/* Chat drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Flex align="center">
              <Avatar size="sm" name="Aquaponics Assistant" bg="green.500" mr={2} />
              <Text>Aquaponics Assistant</Text>
            </Flex>
          </DrawerHeader>

          <DrawerBody p={0}>
            <VStack h="100%" spacing={0}>
              {/* Messages area */}
              <Box
                flex="1"
                w="100%"
                p={4}
                overflowY="auto"
                bg={useColorModeValue('gray.50', 'gray.900')}
              >
                {messages.length === 0 ? (
                  <VStack justify="center" h="100%" spacing={4} opacity={0.7}>
                    <Avatar size="xl" name="Aquaponics Assistant" bg="green.500" />
                    <Text fontSize="lg" textAlign="center">
                      Hi! I'm your Aquaponics Assistant. Ask me anything about your goldfish and spearmint system!
                    </Text>
                    <Text fontSize="sm" textAlign="center">
                      I can help with pH levels, temperature ranges, growth patterns, and troubleshooting common issues.
                    </Text>
                  </VStack>
                ) : (
                  <>
                    <Button size="sm" onClick={startNewChat} mb={4}>
                      New Conversation
                    </Button>
                    {renderMessages()}
                  </>
                )}
                <div ref={messagesEndRef} />
              </Box>
            </VStack>
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" bg={bgColor}>
            <HStack w="100%">
              <Input
                placeholder="Ask about your aquaponics system..."
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                isDisabled={isLoading}
              />
              <IconButton
                colorScheme="green"
                icon={isLoading ? <Spinner size="sm" /> : <ArrowUpIcon />}
                onClick={sendMessage}
                isDisabled={isLoading || !input.trim()}
              />
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Chatbot;
