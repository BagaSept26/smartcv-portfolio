import React from 'react';

function LoadingSpinner(){
    return (
        <div className="flex flex-col justify-center items-center my-8 space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sky-500"></div>
            <p className="text-sky-300 text-lg">Memproses Permintaan Anda ..</p>

        </div>
    )
}
export default LoadingSpinner;