import { storage, Context, PersistentMap } from "near-sdk-core";
import { XCC_GAS, AccountId, asNEAR } from "../../utils";
@nearBindgen
class VehicleOwner {
  constructor(public vehicleOwner: AccountId, public dateAcquired: string) {}
}
class VehicleService {
  constructor(public serviceDate: string, public serviceNotes: string) {}
}

const STATE = "STATE";

@nearBindgen
export class Contract {
  constructor(
    public vehicle = "Mini",
    public vehicleOwners: PersistentMap<
      AccountId,
      VehicleOwner
    > = new PersistentMap<AccountId, VehicleOwner>("vo"),
    public vehicleServiceHistory: Array<VehicleService> = []
  ) {}

  // read the given key from account (contract) storage
  read(key: string): string {
    if (isKeyInStorage(key)) {
      return `✅ Key [ ${key} ] has value [ ${storage.getString(key)!} ]`;
    } else {
      return `🚫 Key [ ${key} ] not found in storage. ( ${this.storageReport()} )`;
    }
  }

  // write the given value at the given key to account (contract) storage
  @mutateState()
  write(key: string, value: string): string {
    storage.set(key, value);
    return `✅ Data saved. ( ${this.storageReport()} )`;
  }

  @mutateState()
  addOrUpdateVehicleOwner(vehicleOwner: AccountId, dateAcquired: string): void {
    add_or_update_vehicle_owner(vehicleOwner, dateAcquired);
  }

  @mutateState()
  addVehicleService(serviceDate: string, serviceNotes: string): void {
    let serviceToAdd = new VehicleService(serviceDate, serviceNotes);
    this.vehicleServiceHistory.push(serviceToAdd);
  }

  // private helper method used by read() and write() above
  private storageReport(): string {
    return `storage [ ${Context.storageUsage} bytes ]`;
  }
}

/**
 * This function exists only to avoid a compiler error
 *
 * @param key string key in account storage
 * @returns boolean indicating whether key exists
 */
function isKeyInStorage(key: string): bool {
  return storage.hasKey(key);
}

export function add_or_update_vehicle_owner(
  vehicleOwner: AccountId,
  dateAcquired: string
): void {
  // create a new VehicleOwner instance
  const newOrUpdatedVehicleOwner = new VehicleOwner(vehicleOwner, dateAcquired);

  // get contract STATE
  const currentContractState = get_contract_state();

  // get current vehicle owners
  const currentVehicleOwners = currentContractState.vehicleOwners;

  // set or update key val pairs
  currentVehicleOwners.set(vehicleOwner, newOrUpdatedVehicleOwner);

  // set playersScore property
  currentContractState.vehicleOwners = currentVehicleOwners;

  // save contract with new values
  resave_contract(currentContractState);
}

export function get_contract_state(): Contract {
  return storage.getSome<Contract>(STATE);
}

export function resave_contract(contract: Contract): void {
  storage.set(STATE, contract);
}
