import { SymbolView, type SymbolViewProps } from 'expo-symbols';

type Props = Omit<SymbolViewProps, 'name'> & { name: string };

/**
 * SymbolView の薄いラッパー。SF Symbol 名を素の string で受ける
 * （データ配列から動的に渡す箇所が多いため）。表示は iOS のみ。
 */
export function Sym({ name, size = 20, ...rest }: Props) {
  return <SymbolView name={name as SymbolViewProps['name']} size={size} {...rest} />;
}
