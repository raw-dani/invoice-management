import { Link, useParams, useNavigate } from 'react-router-dom';
import { useProduct, useDeleteProduct } from './hooks';
import { Card, CardBody, CardHeader, PageHeader } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatMoney, classNames } from '../../lib/utils';
import toast from '../../lib/toast';
import { useState } from 'react';

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const { data: product, isLoading } = useProduct(Number(id));
    const deleteProduct = useDeleteProduct();

    if (isLoading) return <div>Loading...</div>;
    if (!product) return <div>Not found</div>;

    return (
        <>
            <PageHeader
                title={product.name}
                subtitle={`${product.sku} · ${product.type_label}`}
                actions={
                    <>
                        <span className={classNames(
                            'inline-flex px-2 py-0.5 rounded text-xs font-medium',
                            product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        )}>
                            {product.status}
                        </span>
                        <Link to={`/products/${product.id}/edit`}><Button size="sm">Edit</Button></Link>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>Delete</Button>
                    </>
                }
            />

            <Card>
                <CardHeader><h3 className="font-medium">Product Information</h3></CardHeader>
                <CardBody>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-gray-500">Type</dt>
                            <dd>
                                <span className={classNames(
                                    'inline-flex px-2 py-0.5 rounded text-xs font-medium',
                                    product.is_subscription ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                )}>
                                    {product.type_label}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Status</dt>
                            <dd className="capitalize">{product.status}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Price</dt>
                            <dd className="font-medium">{formatMoney(product.price, product.currency)}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Tax Rate</dt>
                            <dd>{product.tax_rate}%</dd>
                        </div>
                        {product.is_subscription && (
                            <div>
                                <dt className="text-gray-500">Billing Cycle</dt>
                                <dd>{product.billing_cycle_label}</dd>
                            </div>
                        )}
                    </dl>
                    {product.description && (
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description}</p>
                        </div>
                    )}
                    {product.notes && (
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.notes}</p>
                        </div>
                    )}
                </CardBody>
            </Card>

            <ConfirmDialog
                open={confirmDelete}
                title="Delete product?"
                message="This action cannot be undone."
                onConfirm={async () => {
                    await deleteProduct.mutateAsync(Number(id));
                    setConfirmDelete(false);
                    toast.success('Product deleted');
                    navigate('/products');
                }}
                onCancel={() => setConfirmDelete(false)}
                danger
            />
        </>
    );
}
