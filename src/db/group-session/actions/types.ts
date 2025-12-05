export enum ActionStatus {
  Success = "success",
  Failure = "failure",
}

export type BaseActionSuccess = { status: ActionStatus.Success };

export type BaseActionFailure<T extends ActionErrorMessage> = {
  status: ActionStatus.Failure;
  message: T;
};

export enum ActionErrorMessage {
  Full = "full",
  AlreadyAllocated = "alreadyAllocated",
  Nonexistent = "nonexistent",
  Existent = "existent",
  NotInGroup = "notInGroup",
  Frozen = "frozen",
}
