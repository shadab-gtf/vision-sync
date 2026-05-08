export type Primitive = string | number | boolean | bigint | symbol | null | undefined;

export type DeepPartial<T> = T extends Primitive
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepPartial<Item>[]
    : T extends (...parameters: readonly unknown[]) => unknown
      ? T
      : {
          readonly [Key in keyof T]?: DeepPartial<T[Key]>;
        };

export type Mutable<T> = {
  -readonly [Key in keyof T]: T[Key];
};
