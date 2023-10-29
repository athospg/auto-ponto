const getRandomUuid = () => {
  try {
    const crypto = require('crypto');
    if ('randomUUID' in crypto) {
      return Object(crypto).randomUUID();
    }
  } catch (err) {
    // ignored
  }

  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(uuid)) {
    console.error('Invalid UUID generated: ' + uuid);
  }

  return uuid;
};

(function Template() {
  const toPascalCase = (str) => str.replace(/(?:^\w|[A-Z]|\b\w)/g, (fl) => fl.toUpperCase()).replace(/\W+/g, '');
  const toCamelCase = (str) => toPascalCase(str).replace(/^./, (firstLetter) => firstLetter.toLowerCase());
  const toKebabCase = (str) => toCamelCase(str).replace(/([A-Z])/g, (word) => '-' + word.toLowerCase());

  const toPascalCaseTitle = (str) =>
    toPascalCase(str)
      .replace(/([A-Z])/g, (word) => ' ' + word)
      .trim();

  return {
    userInputs: [
      {
        title: 'What is the Component Name',
        argumentName: 'name', // will become input in template
        defaultValue: 'Component',
      },
    ],
    template: [
      {
        type: 'folder',
        name: (inputs) => `${toKebabCase(inputs.name)}`,
        children: [
          {
            type: 'file',
            name: (inputs) => `index.ts`,
            content: (inputs) => `export type { ${toPascalCase(inputs.name)}Props } from './${toKebabCase(
              inputs.name,
            )}';
export { ${toPascalCase(inputs.name)} } from './${toKebabCase(inputs.name)}';
`,
          },
          {
            type: 'file',
            name: (inputs) => `${toKebabCase(inputs.name)}.tsx`,
            content: (inputs) => `import './${toKebabCase(inputs.name)}.scss';

import React, { memo, CSSProperties, ReactNode } from 'react';

// import use${toPascalCase(inputs.name)}Hook from './${toKebabCase(inputs.name)}.hook';

export interface ${toPascalCase(inputs.name)}Props {
  children?: ReactNode;
  /**
   * Defines custom className
   */
  className?: string;
  /**
   * Defines component's custom style
   */
  style?: CSSProperties;
  // add new properties here...
}

type Props = ${toPascalCase(inputs.name)}Props;

function ${toPascalCase(inputs.name)}Component(props: Props) {
  const { children, className, style } = props;

  // const { } = use${toPascalCase(inputs.name)}Hook(props);

  return (
    <div className={\`${toKebabCase(inputs.name)} \${className ?? ''}\`.replace(/\\s+/g, ' ').trim()} style={style}>
      <h1>${toPascalCaseTitle(inputs.name)}</h1>
      {children}
    </div>
  );
}

export const ${toPascalCase(inputs.name)} = memo(${toPascalCase(
              inputs.name,
            )}Component) as unknown as typeof ${toPascalCase(inputs.name)}Component;
`,
          },
          {
            type: 'file',
            name: (inputs) => `${toKebabCase(inputs.name)}.hook.ts`,
            content: (inputs) => `import { ${toPascalCase(inputs.name)}Props } from './${toKebabCase(inputs.name)}';

export function use${toPascalCase(inputs.name)}Hook(props: ${toPascalCase(inputs.name)}Props) {
  // TODO

  return { };
}
`,
          },
          {
            type: 'file',
            name: (inputs) => `${toKebabCase(inputs.name)}.scss`,
            content: (inputs) => `.${toKebabCase(inputs.name)} {
  width: 100%;
  height: 100%;
}
`,
          },
        ],
      },
    ],
  };
});
