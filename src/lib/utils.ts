export type ClassValue =
  | string
  | Record<string, boolean | undefined | null>
  | ClassValue[]
  | null
  | undefined
  | false;

export function cn(...classes: ClassValue[]): ClassValue[] {
  return classes.filter(Boolean) as ClassValue[];
}
