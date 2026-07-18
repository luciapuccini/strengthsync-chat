import { queryStaticData } from "./queryStaticData";

export function buildTools() {
  return {
    queryStaticData: queryStaticData(),
  };
}
