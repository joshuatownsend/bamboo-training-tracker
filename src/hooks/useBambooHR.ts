
import { useQuery } from '@tanstack/react-query';
import BambooHRService from '../lib/bamboohr/api';
import { BAMBOO_HR_CONFIG, isBambooConfigured } from '../lib/bamboohr/config';
import { toast } from '../components/ui/use-toast';
import { useState, useEffect } from 'react';

export const useBambooHR = () => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  
  useEffect(() => {
    setIsConfigured(isBambooConfigured());
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
          return [];
        }
        
        try {
          return await getBambooService().getEmployees();
        } catch (error) {
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
          return null;
        }
        
        try {
          return await getBambooService().getEmployee(id);
        } catch (error) {
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
          return [];
        }
        
        try {
          return await getBambooService().getTrainings();
        } catch (error) {
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
          return [];
        }
        
        try {
          return await getBambooService().getTrainingCompletions(employeeId);
        } catch (error) {
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
          return { employees: [], trainings: [], completions: [] };
        }
        
        try {
          return await getBambooService().fetchAllData();
        } catch (error) {
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
