import React from "react";
import { colors } from "@constants/colors";
import fontSizes from "@constants/fontSizes";
import { MdError } from "react-icons/md";
import styled from "styled-components";

const TextInputContainer = styled.div`
  display: flex;
  width: 100%;
  padding: 0.5rem;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-start;
  background-color: ${(props) => props.$bgColor ?? colors.white};
  border-radius: 8px;
  height: 45px;
  border: 1px solid ${(props) => props.$unFocusBorderColor ?? "transparent"};

  &:focus-within {
    border: 1px solid ${(props) => props.$focusBorderColor ?? "transparent"};
  }
`;

const TextInput = styled.input`
  border: none;
  flex: 1;
  height: 100%;
  padding: 0.5rem;
  background-color: transparent;
  &:focus {
    outline: none;
    border: none;
  }

  &::placeholder {
    /* Chrome, Firefox, Opera, Safari 10.1+ */
    color: ${colors.soft400};
    font-size: ${fontSizes.m};
    font-weight: 400;
  }

  &:-ms-input-placeholder {
    /* Internet Explorer 10-11 */
    color: ${colors.soft400};
    font-size: ${fontSizes.m};
    font-weight: 400;
  }

  &::-ms-input-placeholder {
    /* Microsoft Edge */
    color: ${colors.soft400};
    font-size: ${fontSizes.m};
    font-weight: 400;
  }
`;

const Label = styled.label`
  font-size: ${fontSizes.s};
  margin-bottom: 0.2rem;
  display: flex;
  gap: 0.5rem;
  color: ${colors.sub500};
`;
export const ErrorMessage = styled.div`
  display: flex;
  gap: 2;
  align-items: center;
  p {
    margin: 0;
    font-size: ${fontSizes.s};
    color: ${colors?.error} !important;
  }
`;

const Dropdown = styled.ul`
  width: 100%;
  padding: 5px 5px;
  box-shadow: 0px 1px 2px rgba(140, 188, 251, 0.15);
  position: absolute;
  top: 50px;
  right: 0;
  background-color: white;
  z-index: 5;
  border: 1px solid ${colors.soft200};
  border-radius: 10px;
  color: ${colors.gray700};
  li {
    list-style: none;
    padding: 8px;
    cursor: pointer;
    &:hover {
      background-color: ${colors.soft200};
      color: ${colors.primaryDark};
      border-radius: 10px;
    }
  }
`;

const SearchableDropdown = ({
  icon,
  unFocusBorderColor = colors.soft200,
  focusBorderColor = colors.primaryDark,
  widthInPercentage,
  placeholder,
  afterLabel,
  bgColor,
  name,
  type,
  label,
  onKeyDown,
  trailingIcon,
  onClickTrailing,
  setData,
  isLoading,
  // required,
  show,
  errors,
  onFocus,
  onBlur,
  iconEnd,
  errorMessage,
  paddingRight,
  paddingLeft,
  options,
  ...props
}) => {
  return (
    <div className='relative h-fit'>
      <div id='search' style={{ width: `${widthInPercentage}%` }}>
        {label && (
          <Label htmlFor={name} style={{ fontSize: `${fontSizes.m}` }}>
            {label}{" "}
          </Label>
        )}
        <TextInputContainer
          onFocus={onFocus}
          onBlur={onBlur}
          // style={{ fontSize: fontSizes.m }}
          $focusBorderColor={errorMessage ? colors.error : focusBorderColor}
          $unFocusBorderColor={errorMessage ? colors.error : unFocusBorderColor}
          $bgColor={bgColor}
          type={type ?? "text"}
          style={{
            paddingRight: paddingRight ? paddingRight : "1rem",
            paddingLeft: paddingLeft ? paddingLeft : "1rem",
            // border: errors ? "1px #F8284E solid" : "1px #eaecf0 solid",
            fontSize: fontSizes.m,
          }}>
          {icon && <div>{icon}</div>}
          <TextInput
            style={{ fontSize: fontSizes.m }}
            {...props}
            placeholder={placeholder}
            name={name}
            id={name}
            type={type ?? "text"}
            onKeyDown={onKeyDown}
          />
          {iconEnd && <div>{iconEnd}</div>}
        </TextInputContainer>
        {afterLabel && <Label htmlFor={name}>{afterLabel}</Label>}
        {errorMessage && (
          <ErrorMessage>
            <MdError color={colors.error} />
            <p style={{ margin: "5px" }} className='text-error'>
              {errorMessage}
            </p>
          </ErrorMessage>
        )}
      </div>
      {options?.length > 0 && (
        <Dropdown>
          {options?.map((data) => {
            return (
              <li
                onClick={() => {
                  setData(data);
                }}
                key={data.value}>
                {data.label}
              </li>
            );
          })}
        </Dropdown>
      )}
    </div>
  );
};

export default SearchableDropdown;
