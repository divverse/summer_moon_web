import React, { useState, useEffect } from "react";

const MenuForm = ({ handleEditChange, handleEditSubmit, editForm, allMenu, onClose, edit }) => {
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [availableModifiers, setAvailableModifiers] = useState([]);

  // When item changes, update available modifiers
  useEffect(() => {
    if (editForm.item) {
      let modifiers = [];
      for (const group of allMenu) {
        const item = group.items?.find((i) => i.guid === editForm.item);
        if (item) {
          modifiers = item.modifiers || [];
          break;
        }
      }
      setAvailableModifiers(modifiers);
      setSelectedModifiers([]);
    }
  }, [editForm.item]);

  const handleModifierChange = (modifierGroupGuid, optionGuid) => {
    setSelectedModifiers((prev) => {
      const existing = prev.filter((m) => m.groupGuid !== modifierGroupGuid);
      const group = availableModifiers.find((m) => m.guid === modifierGroupGuid);
      const option = group?.options.find((o) => o.guid === optionGuid);

      if (option) {
        return [
          ...existing,
          {
            modifierGroupGuid,
            optionGuid,
            name: option.name,
            price: option.price,
          },
        ];
      }
      return existing;
    });
  };

  const handleSubmit = () => {
    const itemWithModifiers = {
      ...editForm,
      modifiers: selectedModifiers,
      total_price: editForm.quantity * (editForm.unit_price + selectedModifiers.reduce((sum, m) => sum + m.price, 0)),
    };
    console.log("Item with modifiers:", itemWithModifiers);
    handleEditSubmit(itemWithModifiers);
  };

  return (
    <div className='p-4 space-y-4'>
      <h3 className='text-lg font-semibold'>{edit ? "Edit Item" : "Add Item"}</h3>

      <div className='space-y-2'>
        <label className='block text-sm font-medium text-[#4d3127]'>Item</label>
        <select
          name='item'
          value={editForm.item}
          onChange={handleEditChange}
          disabled={edit}
          className='w-full p-2 border border-gray-300 rounded-md'>
          <option value=''>Select an item</option>
          {allMenu?.map((menu) => (
            <optgroup label={menu.group} key={menu.guid}>
              {menu.items?.map((item) => (
                <option key={item.guid} value={item.guid}>
                  {item.name} (${item.price?.toFixed(2) || "0.00"})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {availableModifiers.map((modifierGroup) => (
        <div key={modifierGroup.guid} className='space-y-2'>
          <label className='block text-sm font-medium text-[#4d3127]'>{modifierGroup.group}</label>
          <select
            onChange={(e) => handleModifierChange(modifierGroup.guid, e.target.value)}
            className='w-full p-2 border border-gray-300 rounded-md'
            value={selectedModifiers.find((m) => m.groupGuid === modifierGroup.guid)?.optionGuid || ""}>
            <option value=''>Select {modifierGroup.group.toLowerCase()}</option>
            {modifierGroup.options?.map((option) => (
              <option key={option.guid} value={option.guid}>
                {option.name} {option.price ? `(+$${option.price.toFixed(2)})` : ""}
              </option>
            ))}
          </select>
        </div>
      ))}

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
          value={`$${(
            editForm.quantity *
            (editForm.unit_price + selectedModifiers.reduce((sum, m) => sum + m.price, 0))
          ).toFixed(2)}`}
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
          onClick={handleSubmit}
          className='px-4 py-2 text-sm font-medium text-white bg-[#4d3127] rounded-md hover:bg-[#493932]'>
          {edit ? "Save Changes" : "Add Item"}
        </button>
      </div>
    </div>
  );
};

export default MenuForm;
