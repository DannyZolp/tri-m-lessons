export const grammaticallyCorrectJoin = (data: string[]): string => {
  if (data.length === 1) {
    return data[0];
  } else {
    let str = data.slice(0, -1).join(", ");

    str += ` and ${data[data.length - 1]}`;

    return str;
  }
};
