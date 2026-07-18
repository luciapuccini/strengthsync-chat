import { queryClientProfile } from "./queryClientProfile";
import { queryClientProgram } from "./queryClientProgram";
import { queryClientProgress } from "./queryClientProgress";

export function buildTools() {
  return {
    queryClientProfile: queryClientProfile(),
    queryClientProgram: queryClientProgram(),
    queryClientProgress: queryClientProgress(),
  };
}
