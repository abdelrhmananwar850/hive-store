import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
    const { products, settings } = useStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery) ||
            p.description?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5); // Limit to 5 results for speed

        setResults(filtered);
    }, [query, products]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Search Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="ابحث عن منتج..."
                            className="flex-1 text-lg outline-none text-gray-900 placeholder-gray-400 font-medium"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Results Area */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {query && results.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                لا توجد نتائج بحث عن "{query}"
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {results.map(product => (
                                    <Link
                                        key={product.id}
                                        to={`/product/${product.id}`}
                                        onClick={onClose}
                                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{product.name}</h3>
                                            <p className="text-sm text-gray-500">{product.category}</p>
                                        </div>
                                        <div className="font-bold text-gray-900">
                                            {product.salePrice && product.salePrice < product.price ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-red-600">{product.salePrice} {settings.currency}</span>
                                                    <span className="text-xs text-gray-400 line-through">{product.price}</span>
                                                </div>
                                            ) : (
                                                <span>{product.price} {settings.currency}</span>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {!query && (
                            <div className="p-4">
                                <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">اقتراحات سريعة</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['هواتف', 'ساعات', 'سماعات', 'شواحن'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setQuery(tag)}
                                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-sm transition-colors"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SearchModal;
