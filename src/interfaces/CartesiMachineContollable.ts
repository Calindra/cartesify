export interface CartesiMachineControllable {
    /**
     * Performs both the inspection and advancement of the Cartesi machine.
     * This method inspects the current state of the machine and then advances 
     * its state in a single operation.
     * 
     * - **Inspect**: Retrieves the machine's current state for analysis or debugging.
     * - **Advance**: Progresses the machine's state, potentially altering its behavior or state for future operations.
     * 
     * @returns A promise that resolves with the result of the inspection 
     * after the machine has been advanced. The result may include details 
     * from both the inspection and advancement processes.
     */
    operateMachine(): Promise<any>;
}