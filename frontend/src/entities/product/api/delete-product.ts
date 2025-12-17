import { fetchVoid, joinApiUrl } from '@/shared/api';

export async function deleteProduct(id: number) {
  await fetchVoid(joinApiUrl(`/products/${id}`), { method: 'DELETE' });
}
