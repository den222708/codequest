export interface Language {
  id: string;
  label: string;
  extension: string;
  programizSubdomain: string;
  monacoLang: string;
  defaultCode: string;
}

export const LANGUAGES: Language[] = [
  {
    id: "cpp",
    label: "C++",
    extension: ".cpp",
    programizSubdomain: "cpp",
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
    monacoLang: "python",
    defaultCode: `print("Hello, World!")`,
  },
  {
    id: "java",
    label: "Java",
    extension: ".java",
    programizSubdomain: "java",
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
    monacoLang: "javascript",
    defaultCode: `console.log("Hello, World!");`,
  },
];

export const LANGUAGE_MAP: Record<string, Language> = Object.fromEntries(
  LANGUAGES.map((l) => [l.id, l])
);

export const DEFAULT_LANGUAGE = LANGUAGES[0];
