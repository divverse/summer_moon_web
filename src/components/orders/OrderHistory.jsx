import { useGetOrders } from "@/hooks/orders.hook";
import Link from "next/link";
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const OrderHistory = () => {
  const { data: ordersData, isLoading: loadingOrders } = useGetOrders({
    page: 1,
    limit: 15,
  });
  const orderHistory = ordersData?.data?.data?.orders || [];
  console.log({ orderHistory });
  return (
    <aside className='w-[250px] bg-[#4d3127] text-white p-4 space-y-4 hidden md:block'>
      <h2 className='text-lg font-bold'>Conversation History</h2>
      {loadingOrders && (
        <div className='space-y-2'>
          <SkeletonTheme baseColor='#af957d' highlightColor='#d3b79c'>
            <Skeleton count={5} height={50} className='mb-2 rounded' />
          </SkeletonTheme>
        </div>
      )}
      {!loadingOrders && (
        <ul className='space-y-2'>
          {orderHistory.map((item, idx) => (
            <li key={idx} className='text-sm bg-[#af957d] p-2 rounded cursor-pointer'>
              <Link href={`/order/${item._id}`}>
                <div className='truncate text-[#4d3127] font-bold'>{item.transcript}</div>
                <small className='text-[#8d3b1f]'>
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default OrderHistory;
