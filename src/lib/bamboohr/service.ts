
  // Get trainings for a specific employee
  async getUserTrainings(employeeId: string): Promise<UserTraining[]> {
    try {
      console.log(`Attempting to fetch trainings for employee ID: ${employeeId}`);
      
      if (!employeeId) {
        console.error("No employee ID provided for getUserTrainings");
        return [];
      }
      
      // Use the correct endpoint for employee training records
      const endpoint = `/training/record/employee/${employeeId}`;
      console.log(`Using endpoint for user trainings: ${endpoint}`);
      
      const trainingData = await this.client.fetchFromBamboo(endpoint);
      console.log("Raw user trainings data from BambooHR:", trainingData);
      
      // Get all training types for reference
      const allTrainings = await this.getTrainings();
      const trainingMap = allTrainings.reduce((map, training) => {
        map[training.id] = training;
        return map;
      }, {} as Record<string, Training>);
      
      // Parse the response based on its format
      let trainingsArray: any[] = [];
      
      // Handle the object format where IDs are keys
      if (trainingData && typeof trainingData === 'object' && !Array.isArray(trainingData)) {
        trainingsArray = Object.values(trainingData);
      } else if (Array.isArray(trainingData)) {
        trainingsArray = trainingData;
      }
      
      console.log(`Found ${trainingsArray.length} training records for user`);
      
      if (trainingsArray.length === 0) {
        console.log("No trainings found for this employee");
        return [];
      }
      
      // Convert the data to our UserTraining format
      return trainingsArray.map((record: any) => ({
        id: record.id?.toString() || '',
        employeeId: record.employeeId?.toString() || employeeId,
        trainingId: record.type?.toString() || '',
        completionDate: record.completed || '',
        instructor: record.instructor || '',
        notes: record.notes || '',
        // Include training details if we can find them
        trainingDetails: trainingMap[record.type] || null
      }));
    } catch (error) {
      console.error("Error getting user trainings from BambooHR:", error);
      return [];
    }
  }
