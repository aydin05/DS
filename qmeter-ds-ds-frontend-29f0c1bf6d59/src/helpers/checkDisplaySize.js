export const checkDisplaySize = (slide, display_element) => {
  const checkedItems = slide.items.map((slideItem) => {
    if (
      slideItem.width + slideItem.left > display_element.width ||
      slideItem.height + slideItem.top > display_element.height
    ) {
      return {
        ...slideItem,
        width: 200,
        height: 200,
        left: 0,
        top: 0,
      };
    }
    return slideItem;
  });
  return { ...slide, items: checkedItems };
};
