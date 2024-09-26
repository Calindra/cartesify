export interface CartesiMachineControllable {
    /**
     * Inspects the current state of the Cartesi machine.
     * @returns A promise that resolves with the inspection result.
     */
    doRequestWithInspect(): Promise<any>;
  
    /**
     * Advances the state of the Cartesi machine.
     * @returns A promise that resolves when the machine has advanced.
     */
    // advanceCartesiMachine?(): Promise<void>;
  }