/**
 * 写真の取り込み。
 * ピッカーが返す URI はキャッシュ領域にあり消える可能性があるため、
 * アプリの document ディレクトリ配下（media/）へコピーして永続化する。
 * 本の PDF 生成時はこのローカルファイルを base64 data URI 化して埋め込む（企画書 5-2）。
 */
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { Alert } from 'react-native';

import { newId } from './ids';

export interface PickedImage {
  localUri: string;
  width: number;
  height: number;
}

function mediaDir(): Directory {
  const dir = new Directory(Paths.document, 'media');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function extFromUri(uri: string): string {
  const m = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri);
  return m ? m[1].toLowerCase() : 'jpg';
}

/** ライブラリから写真を選び、document 配下へコピーして返す。 */
export async function pickImages(selectionLimit = 6): Promise<PickedImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('写真へのアクセスが必要です', '設定アプリから写真の許可をオンにしてください。');
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit,
    quality: 0.85,
  });
  if (result.canceled || !result.assets) return [];

  const dir = mediaDir();
  const out: PickedImage[] = [];
  for (const asset of result.assets) {
    try {
      const dest = new File(dir, `${newId()}.${extFromUri(asset.uri)}`);
      new File(asset.uri).copy(dest);
      out.push({ localUri: dest.uri, width: asset.width ?? 0, height: asset.height ?? 0 });
    } catch (e) {
      console.warn('画像コピーに失敗', e);
    }
  }
  return out;
}

/** 端末から写真ファイルを削除（エントリー削除時などに使用）。 */
export function deleteMediaFile(localUri: string) {
  try {
    const f = new File(localUri);
    if (f.exists) f.delete();
  } catch (e) {
    console.warn('画像削除に失敗', e);
  }
}

/** PDF 埋め込み用に data URI 化。remote_url があればそれを優先。 */
export async function toEmbeddableUri(localUri: string, remoteUrl?: string | null): Promise<string> {
  if (remoteUrl) return remoteUrl;
  try {
    const f = new File(localUri);
    const base64 = await f.base64();
    const ext = extFromUri(localUri);
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch {
    return localUri;
  }
}
