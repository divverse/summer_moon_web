import { useGetOrderById } from "@/hooks/orders.hook";
import { Geist, Geist_Mono } from "next/font/google";
import { useRouter } from "next/router";
import OrderHistory from "@/components/orders/OrderHistory";
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SingleOrder = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: order, isLoading } = useGetOrderById(id);
  const orderInfo = order?.data?.data;
  const orderItems = orderInfo?.order?.order?.selections || [];

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen text-[#493932] bg-[#efefef]`}>
      <OrderHistory />

      <main className='flex-1 flex flex-col items-center justify-between p-6 gap-6'>
        <div className='w-full'>
          <div className='text-center'>
            <header className='w-full text-2xl font-bold'>Summer Moon AI</header>
            <p>Order Information</p>
          </div>
        </div>

        <section className='flex flex-col flex-1 items-center justify-center gap-6 w-full max-w-3xl'>
          {isLoading ? (
            <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
              <div className='w-full bg-white p-4 rounded shadow min-h-[50px] mx-2 h-auto'>
                <Skeleton count={3} className="mb-2" />
              </div>
              <div className='w-full bg-white p-4 rounded-lg shadow-md mt-4'>
                <Skeleton width={150} height={24} className="mb-4" />
                <Skeleton count={5} height={50} className="mb-2" />
              </div>
            </SkeletonTheme>
          ) : (
            <>
              <div className='w-full bg-white p-4 rounded shadow min-h-[50px] mx-2 h-auto'>
                <p className='whitespace-pre-wrap animate-pulse text-[#21140f]'>{orderInfo?.transcript}</p>
              </div>

              {orderItems.length > 0 && (
                <div className='w-full bg-white p-4 rounded-lg shadow-md mt-4'>
                  <div className='flex items-center justify-between w-full mb-3'>
                    <h3 className='text-lg font-semibold'>Order Items</h3>
                  </div>
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Item Name
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Quantity
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Unit Price
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Total Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-200'>
                        {orderItems.map((item) => (
                          <tr key={item.guid + (JSON.stringify(item.modifiers) || "")}>
                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                              {item.name || "Unnamed Item"}
                              {item.modifiers?.length > 0 && (
                                <div className='text-xs text-gray-500 mt-1'>
                                  {item.modifiers.map((m) => m.name).join(", ")}
                                </div>
                              )}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{item.quantity || 1}</td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                              ${item.unit_price?.toFixed(2) || "0.00"}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                              ${item.total_price?.toFixed(2) || "0.00"}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan='4' className='px-6 py-4 text-sm font-medium text-gray-900'>
                            Total
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            ${orderInfo?.order?.total_price?.toFixed(2) || "0.00"}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          <button onClick={() => router.push("/")} className='bg-[#4d3127] text-white py-2 px-6 rounded transition-all'>
            Close Order
          </button>
        </section>
      </main>
    </div>
  );
};

export default SingleOrder;
