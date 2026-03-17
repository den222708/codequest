export interface Language {
  id: string;
  label: string;
  extension: string;
  /** Primary Programiz subdomain */
  programizSubdomain: string;
  /**
   * Alternate subdomains for endpoint pool rotation.
   * If primary fails, these are tried in round-robin order.
   * Falls back to [programizSubdomain] if empty.
   */
  programizEndpointPool: string[];
  monacoLang: string;
  defaultCode: string;
}

export const LANGUAGES: Language[] = [
  {
    id: "cpp",
    label: "C++",
    extension: ".cpp",
    programizSubdomain: "cpp",
    programizEndpointPool: ["cpp"],
    monacoLang: "cpp",
    defaultCode: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
  },
  {
    id: "c",
    label: "C",
    extension: ".c",
    programizSubdomain: "c",
    programizEndpointPool: ["c"],
    monacoLang: "c",
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  },
  {
    id: "python",
    label: "Python",
    extension: ".py",
    programizSubdomain: "python3",
    programizEndpointPool: ["python3"],
    monacoLang: "python",
    defaultCode: `print("Hello, World!")`,
  },
  {
    id: "java",
    label: "Java",
    extension: ".java",
    programizSubdomain: "java",
    programizEndpointPool: ["java"],
    monacoLang: "java",
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  },
  {
    id: "javascript",
    label: "JavaScript",
    extension: ".js",
    programizSubdomain: "javascript",
    programizEndpointPool: ["javascript"],
    monacoLang: "javascript",
    defaultCode: `console.log("Hello, World!");`,
  },
];

export const LANGUAGE_MAP: Record<string, Language> = Object.fromEntries(
  LANGUAGES.map((l) => [l.id, l])
);

export const DEFAULT_LANGUAGE = LANGUAGES[0];
