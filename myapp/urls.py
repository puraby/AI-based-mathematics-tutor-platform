from django.urls import path
from . import views
from .views import create_question
from .views import create_quiz
from .views import update_question
from .views import delete_question
from .views import ask_ai
from .views import get_all_quizzes
from .views import update_quiz
from .views import KnowledgeBaseListView, KnowledgeBaseDeleteView



urlpatterns = [
    path('', views.home, name='home'),
    path('api/health/', views.health_check, name='health_check'),
    path('user-registration/', views.user_registration, name='user_registration'),
    path('api/user/create/', views.user_signup, name='user_signup'),
    # path('api/user/<int:user_id>/update/', views.update_user, name='update_user'),
    path('api/user/update/<str:username>/', views.update_user, name='update_user'),
    path('api/user/<int:user_id>/delete/', views.delete_user, name='delete_user'),
    path('api/login/', views.user_login, name='user_login'),
    path('api/create_question/', create_question, name='create_question'),
    path('api/users/', views.list_all_users, name='list_all_users'),
    path('api/list_questions/', views.list_questions),
    path('api/search_questions/', views.search_questions),
    path('api/create_quiz/', create_quiz, name='create_quiz'),
    path('api/questions/<int:question_id>/', update_question, name='update_question'),
    path('api/questions/<int:question_id>/delete/', delete_question, name='delete_question'),
    path('api/ask', ask_ai, name='ask_ai'),
    path('api/list_quiz/', get_all_quizzes, name='get_all_quiz'),
    path('api/quiz/<int:quiz_id>/update/', update_quiz, name='update_quiz'),
    path('api/attend_quiz/', views.attend_quiz, name='attend_quiz'),
    path('api/submit_quiz/', views.submit_quiz, name='submit_quiz'),
    # path('api/questions/<int:question_id>/', views.update_question, name='update_question'),
    path('api/quiz/<int:quiz_id>/publish/', views.publish_quiz, name='publish_quiz'),
    path('api/quiz/<int:quiz_id>/delete/', views.delete_quiz, name='delete_quiz'),
    # path('api/view_result/<int:user_id>/', views.view_result, name='view_result'),
    path('api/quiz_overall_stats/<int:quiz_id>/', views.quiz_overall_stats, name='quiz_overall_stats'),
    path('api/quiz_usernames/<int:quiz_id>/', views.get_usernames_by_quiz, name='get_usernames_by_quiz'),
    # path('api/evaluate_quiz/', views.evaluate_quiz, name='evaluate_quiz'),
    path('api/evaluate_quiz/<int:examId>/', views.evaluate_quiz, name='evaluate_quiz'),
    path('api/submit_feedback/<int:examId>/', views.submit_feedback, name='submit_feedback'),
    path('api/user/getUser/<str:username>/', views.get_user_by_username),
    path('api/user/search/', views.search_users),
    path('api/parent/<str:parent_username>/students/', views.get_assigned_students),
    path('api/parent/<str:username>/assign/', views.assign_student),
    path('api/parent/<str:parent_username>/remove/<str:student_username>/', views.remove_assigned_student),
    path('api/upload_knowledge/', views.upload_knowledge_document),
    path('api/knowledge/', KnowledgeBaseListView.as_view(), name='knowledge-list'),
    path('api/knowledge/<int:id>/', KnowledgeBaseDeleteView.as_view(), name='knowledge-delete'),


]

