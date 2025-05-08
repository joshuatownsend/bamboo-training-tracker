
import { useQuery } from '@tanstack/react-query';
import BambooHRService from '../lib/bamboohr/api';
import { BAMBOO_HR_CONFIG, isBambooConfigured } from '../lib/bamboohr/config';
import { toast } from '../components/ui/use-toast';
import { useState, useEffect } from 'react';

export const useBambooHR = () => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  
  useEffect(() => {
    // Check configuration on mount and whenever localStorage changes
    const checkConfig = () => {
      const configured = isBambooConfigured();
      setIsConfigured(configured);
      console.log('BambooHR configuration status:', configured ? 'Configured' : 'Not configured');
    };
    
    // Check initially
    checkConfig();
    
    // Setup listener for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bamboo_subdomain' || e.key === 'bamboo_api_key') {
        checkConfig();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Allow manual configuration of API key and subdomain
  const configureBamboo = (subdomain: string, apiKey: string) => {
    localStorage.setItem('bamboo_subdomain', subdomain);
    localStorage.setItem('bamboo_api_key', apiKey);
    setIsConfigured(true);
    window.location.reload(); // Reload to refresh queries with new config
  };

  // Create BambooHR service instance with the stored/provided config
  const getBambooService = (): BambooHRService => {
    // First check localStorage
    const storedSubdomain = localStorage.getItem('bamboo_subdomain');
    const storedApiKey = localStorage.getItem('bamboo_api_key');
    
    // Use local storage values if available, otherwise use env vars
    const options = {
      subdomain: storedSubdomain || BAMBOO_HR_CONFIG.subdomain,
      apiKey: storedApiKey || BAMBOO_HR_CONFIG.apiKey
    };
    
    return new BambooHRService(options);
  };

  // Query for all employees
  const useEmployees = () => {
    return useQuery({
      queryKey: ['bamboo', 'employees'],
      queryFn: async () => {
        if (!isConfigured) {
          console.log('BambooHR not configured, returning empty employees array');
          return [];
        }
        
        try {
          const service = getBambooService();
          return await service.getEmployees();
        } catch (error) {
          console.error('Error in useEmployees query:', error);
          toast({
            title: 'Error fetching employees',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'destructive'
          });
          throw error;
        }
      },
      enabled: isConfigured
    });
  };

  // Query for a specific employee
  const useEmployee = (id: string) => {
    return useQuery({
      queryKey: ['bamboo', 'employee', id],
      queryFn: async () => {
        if (!isConfigured || !id) {
          console.log('BambooHR not configured or no ID provided, returning null');
          return null;
        }
        
        try {
          const service = getBambooService();
          return await service.getEmployee(id);
        } catch (error) {
          console.error(`Error in useEmployee query for ID ${id}:`, error);
          toast({
            title: 'Error fetching employee',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'destructive'
          });
          throw error;
        }
      },
      enabled: isConfigured && Boolean(id)
    });
  };

  // Query for all trainings
  const useTrainings = () => {
    return useQuery({
      queryKey: ['bamboo', 'trainings'],
      queryFn: async () => {
        if (!isConfigured) {
          console.log('BambooHR not configured, returning empty trainings array');
          return [];
        }
        
        try {
          const service = getBambooService();
          return await service.getTrainings();
        } catch (error) {
          console.error('Error in useTrainings query:', error);
          toast({
            title: 'Error fetching trainings',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'destructive'
          });
          throw error;
        }
      },
      enabled: isConfigured
    });
  };

  // Query for an employee's training completions
  const useTrainingCompletions = (employeeId: string) => {
    return useQuery({
      queryKey: ['bamboo', 'completions', employeeId],
      queryFn: async () => {
        if (!isConfigured || !employeeId) {
          console.log('BambooHR not configured or no employeeId provided, returning empty completions array');
          return [];
        }
        
        try {
          const service = getBambooService();
          return await service.getTrainingCompletions(employeeId);
        } catch (error) {
          console.error(`Error in useTrainingCompletions query for employee ${employeeId}:`, error);
          toast({
            title: 'Error fetching training completions',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'destructive'
          });
          throw error;
        }
      },
      enabled: isConfigured && Boolean(employeeId)
    });
  };

  // Query for all data at once
  const useAllData = () => {
    return useQuery({
      queryKey: ['bamboo', 'allData'],
      queryFn: async () => {
        if (!isConfigured) {
          console.log('BambooHR not configured, returning empty data object');
          return { employees: [], trainings: [], completions: [] };
        }
        
        try {
          const service = getBambooService();
          return await service.fetchAllData();
        } catch (error) {
          console.error('Error in useAllData query:', error);
          toast({
            title: 'Error fetching data from BambooHR',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'destructive'
          });
          throw error;
        }
      },
      enabled: isConfigured
    });
  };

  return {
    isConfigured,
    configureBamboo,
    useEmployees,
    useEmployee,
    useTrainings,
    useTrainingCompletions,
    useAllData
  };
};

export default useBambooHR;
