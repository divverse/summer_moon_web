import React from "react";

const MenuForm = ({ handleEditChange, handleEditSubmit, editForm, allMenu, onClose, edit }) => {
  return (
    <div className='p-4 space-y-4'>
      <h3 className='text-lg font-semibold'>Edit Item</h3>

      <div className='space-y-2'>
        <label className='block text-sm font-medium text-[#4d3127]'>Item</label>
        <select
          name='item'
          value={editForm.item}
          onChange={handleEditChange}
          disabled={edit}
          className='w-full p-2 border border-gray-300 rounded-md'
          readOnly>
          <option value=''>Select an item</option>
          {allMenu.map((item) => (
            <option key={item.guid} value={item.guid}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className='space-y-2'>
        <label className='block text-sm font-medium text-[#4d3127]'>Quantity</label>
        <input
          type='number'
          name='quantity'
          min='1'
          value={editForm.quantity}
          onChange={handleEditChange}
          className='w-full p-2 border border-gray-300 rounded-md'
        />
      </div>

      <div className='space-y-2'>
        <label className='block text-sm font-medium text-[#4d3127]'>Item Size</label>
        <select
          name='size'
          value={editForm.size}
          onChange={handleEditChange}
          className='w-full p-2 border border-gray-300 rounded-md'
          readOnly>
          <option value=''>Select item size (optional)</option>
          <option key={"small"} value={"Small"}>
            {"Small"}
          </option>
          <option key={"medium"} value={"Medium"}>
            {"Medium"}
          </option>
          <option key={"big"} value={"Big"}>
            {"Big"}
          </option>
        </select>
      </div>

      <div className='space-y-2'>
        <label className='block text-sm font-medium text-[#4d3127]'>Unit Price</label>
        <input
          type='text'
          name='unit_price'
          value={`$${editForm.unit_price.toFixed(2)}`}
          readOnly
          className='w-full p-2 border border-gray-300 rounded-md bg-gray-100'
        />
      </div>

      <div className='space-y-2'>
        <label className='block text-sm font-medium text-[#4d3127]'>Total Price</label>
        <input
          type='text'
          name='total_price'
          value={`$${editForm.total_price.toFixed(2)}`}
          readOnly
          className='w-full p-2 border border-gray-300 rounded-md bg-gray-100'
        />
      </div>

      <div className='flex justify-end space-x-2 pt-4'>
        <button
          onClick={onClose}
          className='px-4 py-2 text-sm font-medium text-[#4d3127] bg-gray-200 rounded-md hover:bg-gray-300'>
          Cancel
        </button>
        <button
          onClick={handleEditSubmit}
          className='px-4 py-2 text-sm font-medium text-white bg-[#4d3127] rounded-md hover:bg-[#493932]'>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default MenuForm;
