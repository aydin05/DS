from rest_framework import filters
 
class CustomSearchFilter(filters.SearchFilter):
    def get_search_fields(self, view, request,*args,**kwargs):
        if view.kwargs.get('pk', None):
            return 
        return ['name', 'description']