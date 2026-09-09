import React from "react";
import {
  makeStyles,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  FluentProvider,
} from "@fluentui/react-components";
import {
  ChevronLeftRegular,
  ChevronRightRegular,
  ChevronDownRegular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  truncatedText: {
    overflowX: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  paginationContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px",
    margin: "10px",
    backgroundColor: 'transparent'
  },
  pageButton: {
    minWidth: "25px",
    height: "25px",
    padding: "0",
    border:"none",
  },
  ellipsis: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "25px",
    height: "25px",
  },
  itemsPerPageMenu: {
    marginLeft: "16px",
  },
  menuTrigger: {
    width: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
}

const CustomPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  pageSizeOptions,
}) => {
  const styles = useStyles();

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 2;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <Button
            key={i}
            className={`${styles.pageButton}`}
            style={{color:currentPage===i?"#4B5563":"#b8b8b8"}}
            onClick={() => onPageChange(i)}
            appearance="secondary"
          >
            {i}
          </Button>
        );
      }
    } else {
      const leftBound = Math.max(1, currentPage - 1);
      const rightBound = Math.min(totalPages, currentPage + 1);

      if (leftBound > 1) {
        pageNumbers.push(
          <Button
            key={1}
            className={styles.pageButton}
            onClick={() => onPageChange(1)}
            appearance="secondary"
            style={{color:"#b8b8b8"}}
          >
            1
          </Button>
        );
        if (leftBound > 2) {
          pageNumbers.push(
            <span key="left-ellipsis" className={styles.ellipsis}>
              ...
            </span>
          );
        }
      }

      for (let i = leftBound; i <= rightBound; i++) {
        pageNumbers.push(
          <Button
            key={i}
            className={`${styles.pageButton}`}
            style={{color:currentPage===i?"#4B5563":"#b8b8b8"}}
            onClick={() => onPageChange(i)}
            appearance={"secondary"}
          >
            {i}
          </Button>
        );
      }

      if (rightBound < totalPages) {
        if (rightBound < totalPages - 1) {
          pageNumbers.push(
            <span key="right-ellipsis" className={styles.ellipsis}>
              ...
            </span>
          );
        }
        pageNumbers.push(
          <Button
            key={totalPages}
            className={styles.pageButton}
            onClick={() => onPageChange(totalPages)}
            appearance="secondary"
          >
            {totalPages}
          </Button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <FluentProvider style={{background:"transparent"}} className={styles.paginationContainer}>
      <Button
        icon={<ChevronLeftRegular />}
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      
      />
      {renderPageNumbers()}
      <Button
        icon={<ChevronRightRegular />}
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button
            className={styles.menuTrigger}
            style={{ minWidth: "60px", maxWidth: "60px", height: "30px", borderRadius: '4px' }}
          >
            {itemsPerPage}
            <ChevronDownRegular />
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {(pageSizeOptions || [5, 10, 20, 50]).map((value) => (
              <MenuItem
                key={value}
                onClick={() => onItemsPerPageChange(value)}
                className={styles.itemsPerPageMenu}
              >
                {value}
              </MenuItem>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>
    </FluentProvider>
  );
};

export default CustomPagination;