export const checkDisplaySize = (item, display_element) => {
  item.items.forEach((item) => {
    if (
      item.width + item.left > display_element.width ||
      item.height + item.top > display_element.height
    ) {
      item.width = 200;
      item.height = 200;
      item.left = 0;
      item.top = 0;
    }
    // else {
    //     item.width = 200;
    //     item.height = 200;
    //     item.left = 0;
    //     item.top = 0;
    // }
  });
  return item;
};
