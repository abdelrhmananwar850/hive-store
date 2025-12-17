import React from 'react';

const SkeletonProductCard: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
            {/* Image Skeleton */}
            <div className="aspect-[4/5] bg-gray-200" />

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <div className="h-4 bg-gray-200 rounded w-3/4" />

                {/* Category */}
                <div className="h-3 bg-gray-200 rounded w-1/4" />

                {/* Price and Add Button */}
                <div className="flex items-center justify-between pt-2">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                </div>
            </div>
        </div>
    );
};

export default SkeletonProductCard;
