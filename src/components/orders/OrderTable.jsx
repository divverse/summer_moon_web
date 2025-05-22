import { FaEdit, FaMicrophone, FaStop } from "react-icons/fa";
import { RiDeleteBinLine } from "react-icons/ri";

export default function OrderTable({ orderItems, status, savedSettings }) {
  return (
    <>
      {orderItems.length > 0 && (
        <>
          <div className='w-full bg-white p-4 rounded-lg shadow-md mt-4'>
            <div className='flex items-center justify-between w-full mb-3'>
              <h3 className='text-lg font-semibold'>Order Items</h3>
              {savedSettings?.order !== "AUTO" && (
                <button
                  onClick={() => setOpenEdit(true)}
                  className='px-4 py-2 text-sm font-medium text-white bg-[#4d3127] rounded-md hover:bg-[#493932]'>
                  Add new Item
                </button>
              )}
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
                      Mod
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Unit Price
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Total Price
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {orderItems.map((item) => (
                    <tr key={item.guid + (item.size || "")}>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {item.name || "Unnamed Item"}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{item.quantity || 1}</td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {item.modifiers?.[0]?.name || "N/A"}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        $
                        {item.unit_price
                          ? item.unit_price?.toFixed(2)
                          : item?.modifiers[0]?.unit_price?.toFixed(2) || "0.00"}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        ${item.total_price?.toFixed(2) || "0.00"}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        <div className='flex items-center gap-3'>
                          <button
                            disabled={savedSettings?.order === "AUTO"}
                            onClick={() => {
                              setEditForm({
                                item: item.guid,
                                quantity: item.quantity,
                                unit_price: item.unit_price,
                                total_price: item.total_price,
                                size: item.size || null,
                              });
                              setOpenEdit(true);
                              setEdit(true);
                            }}
                            aria-label='Edit item'>
                            <FaEdit className={savedSettings?.order === "AUTO" && "opacity-20"} />
                          </button>
                          <button
                            disabled={savedSettings?.order === "AUTO"}
                            onClick={() => handleDeleteItem(item.guid)}
                            aria-label='Delete item'>
                            <RiDeleteBinLine
                              color={"red"}
                              className={savedSettings?.order === "AUTO" && "opacity-20"}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan='4' className='px-6 py-4 text-sm font-medium text-gray-900'>
                      Total
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      ${order?.total_price?.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
