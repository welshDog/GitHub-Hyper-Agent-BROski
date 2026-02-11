#!/usr/bin/env node
declare function runPurchaseChecklist(): Promise<void>;
declare function runPowerOutageSim(): Promise<void>;
declare function runSystemHealthCheck(interactive?: boolean): Promise<void>;
declare function mainMenu(): Promise<void>;

export { mainMenu, runPowerOutageSim, runPurchaseChecklist, runSystemHealthCheck };
