class CurrentUser {
  constructor(readonly id: number) {}
}

const CURRENT_USER_ID = 1;

let instance: CurrentUser | undefined;

export function getCurrentUser(): CurrentUser {
  instance ??= new CurrentUser(CURRENT_USER_ID);
  return instance;
}
